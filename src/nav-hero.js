// src/nav-hero.js
// Pose la classe .is-past-hero sur .nav_fixed quand le hero (data-nav-hero)
// est passé sous la navigation. Sert à changer le style d'une nav transparente.
// Pas de dépendance à GSAP : IntersectionObserver uniquement.

export function initNavHero() {
  const nav = document.querySelector(".nav_fixed");
  const hero = document.querySelector("[data-nav-hero]");
  if (!nav || !hero) return;

  let observer = null;

  function observe() {
    if (observer) observer.disconnect();

    // Le hero est "terminé" quand son bas passe sous le bas de la nav (bannière incluse)
    const navHeight = Math.round(nav.getBoundingClientRect().height);

    observer = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting && entry.boundingClientRect.bottom <= navHeight;
        nav.classList.toggle("is-past-hero", past);
      },
      { rootMargin: `-${navHeight}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(hero);
  }

  observe();

  // Recalcule si la hauteur de la nav change (bannière fermée, resize)
  if (typeof ResizeObserver !== "undefined") {
    let last = nav.offsetHeight;
    new ResizeObserver(() => {
      if (nav.offsetHeight !== last) {
        last = nav.offsetHeight;
        observe();
      }
    }).observe(nav);
  }
}