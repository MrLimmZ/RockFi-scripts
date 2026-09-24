// src/animate/parallax.js
// Léger effet parallax sur une image : elle se déplace verticalement en
// continu, proportionnellement à la position de scroll (scrub: true), pas
// jouée une fois comme nos presets data-inview. Nécessite un ancêtre avec
// overflow:hidden (déjà le cas pour .image_blog, .rf-wrap, etc.) — l'image
// est volontairement mise à l'échelle (scale > 1) pour avoir de la marge et
// ne jamais révéler de bord vide pendant le déplacement.
//
// Usage HTML : ajouter data-parallax directement sur l'<img>.
// Options (data-attributes) :
//   data-parallax-speed="0.15"   intensité du mouvement (0 à ~0.4 conseillé
//                                 — plus haut = plus prononcé)
//   data-parallax-start="top bottom"  point de départ ScrollTrigger
//   data-parallax-end="bottom top"    point de fin ScrollTrigger

function initOne(el) {
  const speed = parseFloat(el.dataset.parallaxSpeed) || 0.15;
  const start = el.dataset.parallaxStart || "top bottom";
  const end = el.dataset.parallaxEnd || "bottom top";

  // Marge de sécurité : l'image doit dépasser son cadre pour que le
  // déplacement ne révèle jamais de bord vide. scale proportionnel à
  // speed, avec un minimum pour rester sûr même à faible vitesse.
  const scale = 1 + Math.max(speed * 1.5, 0.12);

  window.gsap.set(el, {
    scale,
    transformOrigin: "center center",
    willChange: "transform",
  });

  window.gsap.to(el, {
    yPercent: speed * 50,
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start,
      end,
      scrub: true,
    },
  });
}

export function initParallax(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  root.querySelectorAll("[data-parallax]").forEach((el) => {
    if (el instanceof HTMLImageElement || el instanceof HTMLElement) {
      initOne(el);
    }
  });
}