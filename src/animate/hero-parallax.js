// src/animate/hero-parallax.js
// Parallax pour la bannière de haut de page (hero), sans scale.
// L'image est calée sur le haut du conteneur, dépasse au-dessus de la
// distance exacte qu'elle va parcourir, et descend légèrement pendant le
// scroll : elle ne suit la page qu'à moitié (effet de profondeur), sans
// jamais révéler de vide. Au repos, le cadrage est identique à une image
// normale (aucun décalage visible).
//
// Usage : data-hero-parallax directement sur l'<img>.
// Options (data-attributes) :
//   data-hero-parallax-speed="0.15"      amplitude (fraction de la hauteur du conteneur)
//   data-hero-parallax-smooth="1"        lissage du scrub en secondes
//   data-hero-parallax-start="top top"   point de départ ScrollTrigger
//   data-hero-parallax-end="bottom top"  point de fin ScrollTrigger
//   data-hero-parallax-container=".x"    conteneur (défaut : parent direct)

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

  // L'image dépasse au-dessus d'une marge = speed × hauteur du conteneur.
  // Au repos elle est décalée vers le bas de cette marge (cadrage normal),
  // puis elle descend de la même distance pendant le scroll.
  Object.assign(el.style, {
    position: "absolute",
    top: `${-speed * 100}%`,
    left: "0",
    width: "100%",
    height: `${(1 + speed) * 100}%`,
    objectFit: el.style.objectFit || "cover",
    willChange: "transform",
  });

  // yPercent est relatif à la hauteur de l'image : on convertit la marge
  // (speed × conteneur) en % de l'image = speed / (1 + speed).
  const shift = (speed / (1 + speed)) * 100;

  window.gsap.fromTo(
    el,
    { y: 0, yPercent: 0, force3D: true },
    {
      y: 0,
      yPercent: shift,
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