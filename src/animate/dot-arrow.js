// src/animate/dot-arrow.js

const SVG_NS = "http://www.w3.org/2000/svg";

const MID_LEFT = { x: 2.07751, y: 7.99841 };
const MID_RIGHT = { x: 13.9188, y: 7.99841 };
const TOP_MID = { x: 8.00427, y: 2.08142 };
const BOTTOM_MID = { x: 8.00427, y: 13.9174 };
const DOT_RADIUS = 1.31507;

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