// src/animate/hero-parallax.js
// Parallax pour la bannière de haut de page (hero), sans scale.
// L'image remplit exactement son conteneur (top 0, hauteur 100 %) et descend
// pendant le scroll, moins vite que la page : effet de profondeur.
//
// Pas besoin de marge au-dessus : le mouvement ne démarre que quand le haut du
// conteneur atteint le haut du viewport (start "top top"). Le vide laissé en
// haut du conteneur par la translation est alors déjà sorti de l'écran, car le
// conteneur remonte plus vite (vitesse du scroll) que l'image ne descend
// (speed × scroll). Le bas du conteneur n'est jamais découvert, puisque
// l'image se déplace vers le bas.
//
// ATTENTION : cette logique suppose start = "top top" (ou plus tard). Avec un
// départ plus tôt (ex. "top bottom"), le vide serait visible en haut.
//
// Usage : data-hero-parallax directement sur l'<img>.
// Options (data-attributes) :
//   data-hero-parallax-speed="0.15"      amplitude (fraction de la hauteur du conteneur)
//   data-hero-parallax-smooth="1"        lissage du scrub en secondes
//   data-hero-parallax-start="top top"   point de départ ScrollTrigger
//   data-hero-parallax-end="bottom top"  point de fin ScrollTrigger
//   data-hero-parallax-container=".x"    conteneur (défaut : parent direct)

function initOne(el) {
  // Un seul passage par image, même si initHeroParallax() est rappelée
  if (el.dataset.heroParallaxBound === "true") return;
  el.dataset.heroParallaxBound = "true";

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

  // L'image a exactement la taille du conteneur : aucun décalage ni rognage en plus.
  Object.assign(el.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    objectFit: el.style.objectFit || "cover",
    willChange: "transform",
  });

  // Mouvement réduit : l'image reste fixe
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // yPercent est relatif à la hauteur de l'image (= celle du conteneur) :
  // speed 0.15 → l'image descend de 15 % de sa hauteur sur toute la course.
  window.gsap.fromTo(
    el,
    { y: 0, yPercent: 0, force3D: true },
    {
      y: 0,
      yPercent: speed * 100,
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