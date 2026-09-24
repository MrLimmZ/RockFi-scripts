// src/animate/setup.js
// Enregistre ScrollTrigger et le synchronise avec Lenis. Sans ça, Lenis et
// ScrollTrigger pilotent chacun leur propre notion de position de scroll en
// parallèle — même classe de bug que celui qu'on a eu avec le scroll du TOC
// (deux systèmes qui se battent pour la même chose, résultat imprévisible).

import { getLenis } from "../core.js";

let isSetup = false;

export function setupGsap() {
  if (isSetup) return;
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  isSetup = true;
  window.gsap.registerPlugin(window.ScrollTrigger);

  const lenis = getLenis();
  if (lenis) {
    // Lenis pilote le scroll -> on informe ScrollTrigger à chaque frame
    lenis.on("scroll", window.ScrollTrigger.update);

    // ScrollTrigger utilise normalement son propre ticker basé sur le temps
    // ; on le fait plutôt avancer via le raf de gsap, qui tourne déjà en
    // parallèle de la boucle raf() de Lenis dans core.js.
    window.gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    window.gsap.ticker.lagSmoothing(0);
  }
}