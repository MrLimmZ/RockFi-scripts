// src/animate/dot-arrow.js
function getMainDots(svg) {
  return Array.from(svg.querySelectorAll("circle")).filter((c) => {
    const attr = c.getAttribute("fill-opacity");
    return attr === null || parseFloat(attr) === 1;
  });
}

function sortDots(dots) {
  return dots.sort((a, b) => {
    const dy = parseFloat(a.getAttribute("cy")) - parseFloat(b.getAttribute("cy"));
    if (Math.abs(dy) > 0.5) return dy;
    return parseFloat(a.getAttribute("cx")) - parseFloat(b.getAttribute("cx"));
  });
}

function initArrow(svg) {
  const dots = sortDots(getMainDots(svg));
  if (!dots.length) return;

  const duration = parseFloat(svg.dataset.arrowDuration) || 0.2;
  const overlap = svg.dataset.arrowOverlap !== undefined ? parseFloat(svg.dataset.arrowOverlap) : 0.85;
  const finalOpacity = svg.dataset.arrowOpacity !== undefined ? parseFloat(svg.dataset.arrowOpacity) : 0.12;

  const step = duration * (1 - Math.min(Math.max(overlap, 0), 0.95));

  const targets = dots.map((dot) => {
    const prev = dot.previousElementSibling;
    return prev && prev.tagName.toLowerCase() === "foreignobject" ? [prev, dot] : [dot];
  });

  const tl = window.gsap.timeline({ paused: true });
  targets.forEach((els, i) => {
    tl.to(els, { opacity: finalOpacity, duration, ease: "power2.out" }, i * step);
  });

  const trigger = svg.closest("a, button") || svg;
  trigger.addEventListener("mouseenter", () => tl.timeScale(1).play());
  trigger.addEventListener("mouseleave", () => tl.timeScale(1.3).reverse());
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