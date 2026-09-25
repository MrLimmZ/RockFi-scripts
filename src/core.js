// src/core.js
import { prefersReducedMotion } from "./utils/motion-preference.js";

let lenisInstance = null;

export function initLenis() {
  if (typeof window.Lenis === "undefined") return null;
  if (prefersReducedMotion()) return null;

  lenisInstance = new window.Lenis({
    duration: 1.2,
    smoothWheel: true,
    anchors: false,
  });

  // 1. Liaison avec GSAP et ScrollTrigger si présents
  if (typeof window.gsap !== "undefined") {
    if (typeof window.ScrollTrigger !== "undefined") {
      lenisInstance.on("scroll", window.ScrollTrigger.update);
    }

    window.gsap.ticker.add((time) => {
      lenisInstance.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  } else {
    // Fallback RAF classique si GSAP n'est pas chargé
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // 2. Recalcul de la hauteur après chargement complet des assets (images, vidéos)
  window.addEventListener("load", () => {
    lenisInstance.resize();
    if (typeof window.ScrollTrigger !== "undefined") {
      window.ScrollTrigger.refresh();
    }
  });

  // 3. Détection dynamique des changements de hauteur (accordéons FAQ, lazy loading, embeds)
  if (typeof ResizeObserver !== "undefined") {
    const resizeObserver = new ResizeObserver(() => {
      lenisInstance.resize();
      if (typeof window.ScrollTrigger !== "undefined") {
        window.ScrollTrigger.refresh();
      }
    });
    resizeObserver.observe(document.body);
  }

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}

export function init() {
  initLenis();
}