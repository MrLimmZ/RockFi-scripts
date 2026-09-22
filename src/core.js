// src/core.js
import { prefersReducedMotion } from "./utils/motion-preference.js";

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

export function init() {
  initLenis();
}