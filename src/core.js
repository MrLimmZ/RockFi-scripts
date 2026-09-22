import { prefersReducedMotion } from "./utils/motion-preference.js";

// Lenis est chargé globalement via le footer code Webflow (unpkg),
// donc window.Lenis est déjà disponible ici, pas besoin de l'importer.

let lenisInstance = null;

export function initLenis() {
  if (typeof window.Lenis === "undefined") return null;
  if (prefersReducedMotion()) return null;

  lenisInstance = new window.Lenis({
    duration: 1.2,
    smoothWheel: true,
  });

  function raf(time) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}

function init() {
  initLenis();
  // Ajouter ici les initialisations globales (ScrollTrigger, nav, etc.)
}

document.addEventListener("DOMContentLoaded", init);
