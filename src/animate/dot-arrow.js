// src/animate/dot-arrow.js
// Anime une "flèche rapide" par-dessus l'icône à 9 points (3x3), déclenchée
// au survol (hover) du bouton/lien parent. Chaque segment se dessine en 2
// phases : d'abord son EXTRÉMITÉ (x2,y2) avance vers le point d'arrivée
// (le trait grandit), puis son DÉBUT (x1,y1) la rattrape (le trait se
// résorbe sur place) — le segment semble voyager puis disparaître sur sa
// cible, plutôt que de repartir en arrière.
//
// Couleur : lue directement depuis le fill du premier point PLEIN trouvé
// dans le SVG (fill-opacity absent ou = 1), pas depuis un data-attribute
// fixe — donc si l'icône change de couleur (variante blanche sur fond
// sombre, currentColor...), la flèche s'adapte automatiquement sans rien
// dupliquer côté HTML. data-arrow-color reste un fallback explicite si
// aucun point plein n'est détecté.
//
// Effet "comète" : chaque trait est peint avec un gradient (transparent à
// la queue, opaque à la tête), recalculé à chaque frame pour suivre les
// coordonnées réelles du trait, qui bougent pendant l'animation.
//
// Séquence : 1) le trait du milieu (gauche→droite) voyage et se résorbe sur
// le point droit, 2) les deux branches (droite→haut, droite→bas) voyagent
// et se résorbent EXACTEMENT en même temps (label partagé).
//
// Déclenchement : mouseenter sur le plus proche <a> ou <button> ancêtre du
// SVG relance l'animation depuis le début à chaque survol (tl.restart()).
//
// Coordonnées codées en dur : cette icône (9 cercles, viewBox 0 0 16 16)
// est réutilisée identique à plusieurs endroits du site.
//
// Usage HTML : ajouter data-dot-arrow directement sur la balise <svg>,
// à l'intérieur d'un <a> ou <button>.
// Options (data-attributes sur le <svg>) :
//   data-arrow-color="#1A1A1A"        fallback si aucun point plein détecté
//   data-arrow-stage1-duration="0.5"  durée totale du trait milieu (2 phases)
//   data-arrow-stage2-duration="0.45" durée totale des 2 branches (2 phases)

const SVG_NS = "http://www.w3.org/2000/svg";

const MID_LEFT = { x: 2.07751, y: 7.99841 };
const MID_RIGHT = { x: 13.9188, y: 7.99841 };
const TOP_MID = { x: 8.00427, y: 2.08142 };
const BOTTOM_MID = { x: 8.00427, y: 13.9174 };
const DOT_RADIUS = 1.31507;

// Cherche le premier <circle> à opacité pleine (pas de fill-opacity, ou
// fill-opacity="1") et renvoie sa couleur calculée réelle — résout aussi
// currentColor en la vraie couleur héritée, via getComputedStyle.
function getFullDotColor(svg, fallback) {
  const circles = Array.from(svg.querySelectorAll("circle"));
  const fullCircle = circles.find((c) => {
    const attr = c.getAttribute("fill-opacity");
    return attr === null || parseFloat(attr) === 1;
  });

  if (!fullCircle) return fallback;

  const computed = getComputedStyle(fullCircle).fill;
  return computed && computed !== "none" ? computed : fallback;
}

function getDefs(svg) {
  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

function createCometGradient(svg, color) {
  const id = `arrow-comet-${Math.random().toString(36).slice(2, 9)}`;
  const gradient = document.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", id);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");

  [
    { offset: "0", opacity: "0" },
    { offset: "1", opacity: "1" },
  ].forEach(({ offset, opacity }) => {
    const stop = document.createElementNS(SVG_NS, "stop");
    stop.setAttribute("offset", offset);
    stop.setAttribute("stop-color", color);
    stop.setAttribute("stop-opacity", opacity);
    gradient.appendChild(stop);
  });

  getDefs(svg).appendChild(gradient);
  return { gradient, id };
}

function createLine(svg, from, strokeWidth, color) {
  const line = document.createElementNS(SVG_NS, "line");
  line.setAttribute("x1", from.x);
  line.setAttribute("y1", from.y);
  line.setAttribute("x2", from.x);
  line.setAttribute("y2", from.y);
  line.setAttribute("stroke-width", strokeWidth);
  line.setAttribute("stroke-linecap", "round");

  const { gradient, id } = createCometGradient(svg, color);
  line.setAttribute("stroke", `url(#${id})`);

  line._syncGradient = () => {
    gradient.setAttribute("x1", line.getAttribute("x1"));
    gradient.setAttribute("y1", line.getAttribute("y1"));
    gradient.setAttribute("x2", line.getAttribute("x2"));
    gradient.setAttribute("y2", line.getAttribute("y2"));
  };

  svg.appendChild(line);
  return line;
}

function addTravel(tl, line, to, duration, position) {
  const half = duration / 2;
  tl.to(
    line,
    {
      attr: { x2: to.x, y2: to.y },
      duration: half,
      ease: "power1.inOut",
      onUpdate: line._syncGradient,
    },
    position,
  );
  tl.to(
    line,
    {
      attr: { x1: to.x, y1: to.y },
      duration: half,
      ease: "power1.inOut",
      onUpdate: line._syncGradient,
    },
    `${position}+=${half}`,
  );
}

function initArrow(svg) {
  const fallbackColor = svg.dataset.arrowColor || "#1A1A1A";
  const color = getFullDotColor(svg, fallbackColor);
  const strokeWidth = DOT_RADIUS * 1.1;
  const stage1Duration = parseFloat(svg.dataset.arrowStage1Duration) || 0.5;
  const stage2Duration = parseFloat(svg.dataset.arrowStage2Duration) || 0.45;

  const line1 = createLine(svg, MID_LEFT, strokeWidth, color);
  const line2a = createLine(svg, MID_RIGHT, strokeWidth, color);
  const line2b = createLine(svg, MID_RIGHT, strokeWidth, color);

  const tl = window.gsap.timeline({ paused: true });

  addTravel(tl, line1, MID_RIGHT, stage1Duration, 0);
  tl.addLabel("branches", stage1Duration);
  addTravel(tl, line2a, TOP_MID, stage2Duration, "branches");
  addTravel(tl, line2b, BOTTOM_MID, stage2Duration, "branches");

  const trigger = svg.closest("a, button") || svg;
  trigger.addEventListener("mouseenter", () => tl.restart());
}

export function initDotArrow(root = document) {
  if (typeof window.gsap === "undefined") return;

  root.querySelectorAll("[data-dot-arrow]").forEach((svg) => {
    if (svg instanceof SVGSVGElement) {
      initArrow(svg);
    } else {
      console.warn("[dot-arrow] l'élément data-dot-arrow n'est pas un <svg>", svg);
    }
  });
}