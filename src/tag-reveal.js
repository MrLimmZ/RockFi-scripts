// src/tag-reveal.js
// Révèle un segment de trait qui parcourt UNE SEULE FOIS le contour d'un
// .tag-animated, puis se résorbe sur lui-même (longueur → 0, tête fixe) —
// le SVG (rect superposé, dimensionné et arrondi pour matcher exactement
// l'élément) est entièrement construit en JS. Même technique que
// src/animate/svg-trace.js (gradient recalculé à chaque frame).
//
// Séquence complète pour chaque tag : 0) apparition — la longueur grandit
// de 0 à segmentLength, en douceur (ease "power1.in" : démarre lentement,
// accélère — évite un saut visuel initial) — 1) trajet — la tête avance de
// 0 à totalLength en travelDuration secondes FIXES, peu importe le
// périmètre du tag — 2) résorption — la tête reste fixe, la longueur
// décroît à 0 rapidement (pas de fondu d'opacité).
//
// Enchaînement séquentiel entre tags : quand plusieurs .tag-animated
// partagent un ancêtre commun, chacun démarre APRÈS que le précédent ait
// entièrement terminé (trajet + résorption + pause) — le délai est la
// somme des durées complètes de tous les tags qui le précèdent.
//
// Déclenchée la première fois que le tag devient visible à l'écran
// (IntersectionObserver, seuil 40%, une seule fois par tag).
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
//   data-tag-trace-stagger="0.1"      pause entre la fin d'un tag et le début du suivant, en secondes

const SVG_NS = "http://www.w3.org/2000/svg";

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

function siblingIndex(tag) {
  let ancestor = tag.parentElement;

  while (ancestor) {
    const matches = Array.from(ancestor.querySelectorAll(".tag-animated"));
    if (matches.length > 1) {
      return matches.indexOf(tag);
    }
    ancestor = ancestor.parentElement;
  }

  return 0;
}

function animateTag(tag) {
  if (typeof window.gsap === "undefined") return;

  const built = buildTraceSvg(tag);
  if (!built) return;
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
  const gap = parseFloat(tag.dataset.tagTraceStagger) || 0.1;
  const delay = siblingIndex(tag) * (travelDuration + endDuration + gap);

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
  // "power1.in" démarre lentement et accélère — évite le saut visuel
  // initial que produisait "power1.out" (qui atteint quasi sa valeur
  // finale dès les premières millisecondes).
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

  // Phase 1 — trajet principal : la tête avance de 0 à totalLength, en
  // travelDuration secondes fixes, quelle que soit la valeur de totalLength.
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

  // Phase 2 — résorption : la tête reste fixe à totalLength, la longueur
  // décroît de segmentLength à 0 (pas de fondu d'opacité).
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

function initTagReveal() {
  const tags = document.querySelectorAll(".tag-animated");
  if (!tags.length || typeof window.gsap === "undefined") return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateTag(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 },
  );

  tags.forEach((tag) => observer.observe(tag));
}

export { initTagReveal };