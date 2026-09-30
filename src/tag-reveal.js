// src/tag-reveal.js
// Révèle un segment de trait qui parcourt UNE SEULE FOIS le contour d'un
// .tag-animated, puis se résorbe sur lui-même (longueur → 0, tête fixe) —
// le SVG (rect superposé, dimensionné et arrondi pour matcher exactement
// l'élément) est entièrement construit en JS. Même technique que
// src/animate/svg-trace.js (gradient recalculé à chaque frame).
//
// Séquence complète pour chaque tag : 0) apparition — la longueur grandit
// de 0 à segmentLength, en douceur (ease "power1.in") — 1) trajet — la tête
// avance de 0 à totalLength en travelDuration secondes FIXES, peu importe le
// périmètre du tag — 2) résorption — la tête reste fixe, la longueur
// décroît à 0 rapidement (pas de fondu d'opacité).
//
// Enchaînement entre tags : les tags qui apparaissent ENSEMBLE à l'écran
// (même lot d'IntersectionObserver) sont triés de haut en bas puis de
// gauche à droite. Chacun démarre `stagger` secondes après le précédent,
// SANS attendre sa fin : les animations se chevauchent avec un léger
// décalage de lancement. Le délai est plafonné à MAX_DELAY.
//
// Déclenchée la première fois que le tag devient visible à l'écran
// (IntersectionObserver, seuil 10%, une seule fois par tag). Les tags
// ajoutés après coup (Finsweet, "load more", filtres) sont pris en compte
// via un MutationObserver. Un tag non mesurable (masqué, largeur 0) n'est
// pas marqué comme traité : il pourra être réessayé au prochain rendu.
//
// Le rayon du rect est plafonné à height/2 : un border-radius CSS très
// supérieur à cette limite (ex: 999px pour un effet "pilule") produit
// toujours ce plafond visuellement.
//
// Le SVG est positionné en absolute avec un inset négatif égal à la
// largeur du border du tag : inset:0 aligne sur le padding-box (bord
// intérieur du border) alors que width/height (= offsetWidth/Height,
// box-sizing: border-box) incluent déjà le border.
//
// Usage HTML :
//   <div class="tag-animated"><div>Paris</div></div>
//
// Options via data-attributes sur .tag-animated (toutes optionnelles) :
//   data-tag-trace-length="30"        longueur du segment, en unités SVG
//   data-tag-trace-duration="0.5"     durée du trajet principal, en secondes (fixe)
//   data-tag-trace-end-duration="0.15" durée de la résorption finale, en secondes
//   data-tag-trace-color="#1A1A1A"    couleur du trait
//   data-tag-trace-width="1"          épaisseur du trait, en px
//   data-tag-trace-stagger="0.12"     décalage de lancement entre deux tags, en secondes

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_STAGGER = 0.12; // décalage de lancement entre deux tags (s), les animations se chevauchent
const MAX_DELAY = 3; // garde-fou pour les très longues listes

function createFadeGradient(svg, color) {
  const gradientId = `tag-trace-${Math.random().toString(36).slice(2, 9)}`;
  const gradient = document.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", gradientId);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");

  [
    { offset: "0", opacity: "0" },
    { offset: "0.5", opacity: "1" },
    { offset: "1", opacity: "0" },
  ].forEach(({ offset, opacity }) => {
    const stop = document.createElementNS(SVG_NS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    stop.setAttribute("stop-opacity", opacity);
    gradient.appendChild(stop);
  });

  const defs = document.createElementNS(SVG_NS, "defs");
  defs.appendChild(gradient);
  svg.appendChild(defs);

  return { gradient };
}

function buildTraceSvg(tag) {
  const width = tag.offsetWidth;
  const height = tag.offsetHeight;

  if (!width || !height) return null; // élément pas encore rendu/mesurable

  const computed = getComputedStyle(tag);
  const radius = Math.min(parseFloat(computed.borderRadius) || 0, height / 2);

  const strokeWidth = parseFloat(tag.dataset.tagTraceWidth) || 1;
  const inset = strokeWidth / 2;

  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";
  svg.style.overflow = "visible";

  const rect = document.createElementNS(SVG_NS, "rect");
  rect.setAttribute("x", inset);
  rect.setAttribute("y", inset);
  rect.setAttribute("width", width - strokeWidth);
  rect.setAttribute("height", height - strokeWidth);
  rect.setAttribute("rx", Math.max(radius - inset, 0));
  rect.setAttribute("ry", Math.max(radius - inset, 0));
  rect.setAttribute("fill", "none");
  rect.setAttribute("stroke-width", strokeWidth);

  svg.appendChild(rect);
  return { svg, rect };
}

function animateTag(tag, delay = 0) {
  if (typeof window.gsap === "undefined") return;
  if (tag.dataset.tagTraced) return;

  const built = buildTraceSvg(tag);
  if (!built) return; // pas mesurable : sera réessayé au prochain rendu
  tag.dataset.tagTraced = "1";

  const { svg, rect } = built;

  if (getComputedStyle(tag).position === "static") {
    tag.style.position = "relative";
  }

  const borderWidth = parseFloat(getComputedStyle(tag).borderWidth) || 0;
  svg.style.inset = `-${borderWidth}px`;

  tag.appendChild(svg);

  const totalLength = rect.getTotalLength();
  const segmentLength = parseFloat(tag.dataset.tagTraceLength) || totalLength * 0.12;
  const travelDuration = parseFloat(tag.dataset.tagTraceDuration) || 0.5;
  const endDuration = parseFloat(tag.dataset.tagTraceEndDuration) || 0.15;
  const color = tag.dataset.tagTraceColor || "#1A1A1A";

  const { gradient } = createFadeGradient(svg, color);

  rect.style.stroke = `url(#${gradient.id})`;

  function setSegment(start, length) {
    rect.style.strokeDasharray = `${length} ${totalLength - length}`;
    rect.style.strokeDashoffset = `${-start}`;
  }

  function updateGradient(start, length) {
    const p1 = rect.getPointAtLength(((start % totalLength) + totalLength) % totalLength);
    const p2 = rect.getPointAtLength((((start + length) % totalLength) + totalLength) % totalLength);
    gradient.setAttribute("x1", p1.x);
    gradient.setAttribute("y1", p1.y);
    gradient.setAttribute("x2", p2.x);
    gradient.setAttribute("y2", p2.y);
  }

  setSegment(0, 0);

  let currentLength = 0;

  const tl = window.gsap.timeline({ delay });

  // Phase 0 — apparition : la longueur grandit de 0 à segmentLength.
  const growProxy = { len: 0 };
  tl.to(growProxy, {
    len: segmentLength,
    duration: Math.min(travelDuration * 0.2, 0.15),
    ease: "power1.in",
    onUpdate: () => {
      currentLength = growProxy.len;
      setSegment(0, currentLength);
      updateGradient(0, currentLength);
    },
  });

  // Phase 1 — trajet principal : la tête avance de 0 à totalLength.
  const travelProxy = { pos: 0 };
  tl.to(travelProxy, {
    pos: totalLength,
    duration: travelDuration,
    ease: "none",
    onUpdate: () => {
      const start = travelProxy.pos - currentLength;
      setSegment(start, currentLength);
      updateGradient(start, currentLength);
    },
  });

  // Phase 2 — résorption : la tête reste fixe, la longueur décroît à 0.
  const shrinkProxy = { len: segmentLength };
  tl.to(shrinkProxy, {
    len: 0,
    duration: endDuration,
    ease: "power2.in",
    onUpdate: () => {
      currentLength = shrinkProxy.len;
      const start = totalLength - currentLength;
      setSegment(start, currentLength);
      updateGradient(start, currentLength);
    },
  });

  tl.call(() => svg.remove());
}

function initTagReveal(root = document) {
  if (typeof window.gsap === "undefined") return;

  const observed = new WeakSet();
  let queueIndex = 0;
  let resetTimer = null;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => {
          const ra = a.target.getBoundingClientRect();
          const rb = b.target.getBoundingClientRect();
          return ra.top - rb.top || ra.left - rb.left;
        });

      visible.forEach((entry) => {
        const tag = entry.target;
        observer.unobserve(tag);

        const stagger = parseFloat(tag.dataset.tagTraceStagger) || DEFAULT_STAGGER;

        // Chaque tag démarre `stagger` secondes après le précédent, sans attendre sa fin
        const delay = Math.min(queueIndex * stagger, MAX_DELAY);
        queueIndex += 1;

        animateTag(tag, delay);

        // Tag non mesurable (masqué) : on le remet en observation pour un
        // prochain rendu au lieu de le perdre.
        if (!tag.dataset.tagTraced) observed.delete(tag);
      });

      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        queueIndex = 0;
      }, 300);
    },
    { threshold: 0.1 },
  );

  function observeAll(scope) {
    scope.querySelectorAll(".tag-animated").forEach((tag) => {
      if (observed.has(tag) || tag.dataset.tagTraced) return;
      observed.add(tag);
      observer.observe(tag);
    });
  }

  observeAll(root);

  // Tags ajoutés après coup (Finsweet, "load more", filtres)
  new MutationObserver(() => observeAll(document)).observe(document.body, {
    childList: true,
    subtree: true,
  });
}

export { initTagReveal };