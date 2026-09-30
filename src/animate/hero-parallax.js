// src/animate/hero-parallax.js

function initOne(el) {
  const speed = parseFloat(el.dataset.heroParallaxSpeed) || 0.15;
  const smooth = parseFloat(el.dataset.heroParallaxSmooth) || 1;
  const start = el.dataset.heroParallaxStart || "top top";
  const end = el.dataset.heroParallaxEnd || "bottom top";

  const container = el.dataset.heroParallaxContainer
    ? el.closest(el.dataset.heroParallaxContainer)
    : el.parentElement;
  if (!container) return;

  if (getComputedStyle(container).position === "static") {
    container.style.position = "relative";
  }
  container.style.overflow = "hidden";

  Object.assign(el.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: `${(1 + speed) * 100}%`,
    objectFit: el.style.objectFit || "cover",
    willChange: "transform",
  });

  window.gsap.fromTo(
    el,
    { y: 0, yPercent: -(speed / (1 + speed)) * 100, force3D: true },
    {
      y: 0,
      yPercent: 0,
      ease: "none",
      force3D: true,
      scrollTrigger: {
        trigger: container,
        start,
        end,
        scrub: smooth,
        invalidateOnRefresh: true,
      },
    },
  );
}

export function initHeroParallax(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  root.querySelectorAll("[data-hero-parallax]").forEach((el) => {
    if (el instanceof HTMLElement) initOne(el);
  });
}