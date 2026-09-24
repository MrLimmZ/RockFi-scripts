// src/animate/svg-trace.js
// Fait défiler un petit segment de trait le long du contour d'un <path> SVG
// en boucle infinie, avec un fondu sur les deux bords du segment (opaque au
// centre, transparent aux extrémités) — recalculé à chaque frame pour
// suivre le segment en mouvement le long d'une courbe (un gradient SVG
// classique est ancré à des coordonnées fixes, donc ne "suivrait" pas un
// objet qui se déplace).
//
// Usage HTML :
//   <path data-svg-trace d="M10 10 L90 10 ..." />
//
// Options via data-attributes sur le <path> :
//   data-trace-length="60"     longueur du segment visible, en unités SVG
//   data-trace-duration="4"    durée d'un tour complet, en secondes
//   data-trace-color="#1A1A1A" couleur du trait (sinon hérite du stroke existant)
//   data-trace-offset="0.5"    point de départ sur le contour, en fraction
//                               de 0 à 1 (0.5 = démarre à l'opposé exact du
//                               tracé) — permet de superposer plusieurs
//                               traces sur le même path sans qu'elles se
//                               chevauchent au démarrage.

const SVG_NS = "http://www.w3.org/2000/svg";

function createFadeGradient(svg, color) {
  const gradientId = `trace-fade-${Math.random().toString(36).slice(2, 9)}`;
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

  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svg.insertBefore(defs, svg.firstChild);
  }
  defs.appendChild(gradient);

  return { gradient, gradientId };
}

function initTrace(path) {
  const svg = path.closest("svg");
  if (!svg) return;

  const totalLength = path.getTotalLength();
  const segmentLength = parseFloat(path.dataset.traceLength) || totalLength * 0.08;
  const duration = parseFloat(path.dataset.traceDuration) || 4;
  const color = path.dataset.traceColor || getComputedStyle(path).stroke || "#1A1A1A";
  const startFraction = parseFloat(path.dataset.traceOffset) || 0;
  const startOffset = startFraction * totalLength;

  const { gradient } = createFadeGradient(svg, color);

  path.style.fill = "none";
  path.style.stroke = `url(#${gradient.id})`;
  path.style.strokeDasharray = `${segmentLength} ${totalLength - segmentLength}`;
  // Décale le dasharray dès le départ pour que le segment démarre à
  // startOffset plutôt qu'à 0 — permet à plusieurs traces sur le même path
  // de démarrer à des points différents du contour.
  path.style.strokeDashoffset = `${startOffset}`;

  function updateGradient() {
    const raw = -window.gsap.getProperty(path, "strokeDashoffset");
    const start = ((raw % totalLength) + totalLength) % totalLength;
    const end = (start + segmentLength) % totalLength;

    const p1 = path.getPointAtLength(start);
    const p2 = path.getPointAtLength(end);
    gradient.setAttribute("x1", p1.x);
    gradient.setAttribute("y1", p1.y);
    gradient.setAttribute("x2", p2.x);
    gradient.setAttribute("y2", p2.y);
  }

  window.gsap.to(path, {
    strokeDashoffset: startOffset - totalLength,
    duration,
    ease: "none",
    repeat: -1,
    onUpdate: updateGradient,
  });

  updateGradient(); // état initial correct avant le premier tick
}

export function initSvgTrace(root = document) {
  if (typeof window.gsap === "undefined") return;

  root.querySelectorAll("[data-svg-trace]").forEach((path) => {
    if (path instanceof SVGPathElement) {
      initTrace(path);
    } else {
      console.warn("[svg-trace] l'élément data-svg-trace n'est pas un <path>", path);
    }
  });
}