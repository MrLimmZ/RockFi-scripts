// src/animate/scan.js
// Lit les attributs data-inview / data-text-reveal / data-grid-enter du DOM
// (même convention de nommage que le reste du site) et déclenche l'anim
// GSAP correspondante au scroll via ScrollTrigger.
//
// data-inview="fade-up"        élément simple : preset appliqué directement
// data-text-reveal             raccourci pour le preset "heading" (titre
//                               révélé mot par mot)
// data-grid-enter               conteneur : anime chaque enfant direct
//                               data-anim-item="preset" avec un stagger
//
// Options communes (sur n'importe lequel des 3) :
//   data-anim-delay="0.2"
//   data-anim-duration="1"
//   data-anim-stagger="0.08"
//   data-anim-distance="48"
//   data-anim-scale="0.9"
//   data-anim-start="top 85%"
//   data-anim-repeat="true"
//   data-anim-overlay-start="0.6"   (image-wipe uniquement)
//   data-anim-overlay-color="#000"  (image-wipe uniquement)
//
// Décalage entre frères : pour data-inview, siblingIndex() remonte les
// ancêtres jusqu'à trouver le premier niveau qui contient PLUSIEURS
// éléments avec le même data-inview (pas juste les frères DIRECTS) — sinon
// des éléments imbriqués différemment (ex: chaque image dans un <a> séparé,
// comme une liste d'articles générée en CMS) ne partagent jamais de parent
// direct commun et reçoivent tous un index 0, donc aucun décalage.
//
// La classe .--visible est ajoutée en même temps que l'animation démarre —
// cohérent avec le CSS qui masque ces éléments par défaut (voir animate.scss).

import { PRESETS } from "./presets.js";

function readOpts(el) {
  return {
    delay: el.dataset.animDelay ? parseFloat(el.dataset.animDelay) : undefined,
    duration: el.dataset.animDuration ? parseFloat(el.dataset.animDuration) : undefined,
    stagger: el.dataset.animStagger ? parseFloat(el.dataset.animStagger) : undefined,
    distance: el.dataset.animDistance ? parseFloat(el.dataset.animDistance) : undefined,
    scale: el.dataset.animScale ? parseFloat(el.dataset.animScale) : undefined,
    overlayStart: el.dataset.animOverlayStart ? parseFloat(el.dataset.animOverlayStart) : undefined,
    overlayColor: el.dataset.animOverlayColor || undefined,
  };
}

// Remonte les ancêtres de `el` jusqu'à trouver le premier niveau qui
// contient plusieurs descendants avec le même data-inview — index de `el`
// dans cet ensemble, en ordre document (donc visuel/logique).
function siblingIndex(el) {
  const presetName = el.dataset.inview;
  let ancestor = el.parentElement;

  while (ancestor) {
    const matches = Array.from(ancestor.querySelectorAll(`[data-inview="${presetName}"]`));
    if (matches.length > 1) {
      return matches.indexOf(el);
    }
    ancestor = ancestor.parentElement;
  }

  return 0; // aucun regroupement trouvé, élément isolé
}

function attachTrigger(el, animation, opts) {
  const start = el.dataset.animStart || "top 85%";
  const repeat = el.dataset.animRepeat === "true";

  animation.pause();

  window.ScrollTrigger.create({
    trigger: el,
    start,
    onEnter: () => {
      el.classList.add("--visible");
      animation.play();
    },
    onEnterBack: () => {
      if (repeat) {
        el.classList.add("--visible");
        animation.play();
      }
    },
    onLeaveBack: () => {
      if (repeat) {
        el.classList.remove("--visible");
        animation.pause(0);
      }
    },
  });
}

export function scanAnimations(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  // data-inview="preset" — élément simple, avec décalage entre "frères"
  root.querySelectorAll("[data-inview]").forEach((el) => {
    const presetName = el.dataset.inview;
    const preset = PRESETS[presetName];
    if (!preset) {
      console.warn(`[animate] preset inconnu sur data-inview : "${presetName}"`, el);
      return;
    }

    const opts = readOpts(el);
    const staggerStep = opts.stagger ?? 0.15;
    const extraDelay = siblingIndex(el) * staggerStep;
    opts.delay = (opts.delay ?? 0) + extraDelay;

    const animation = preset(el, opts);
    attachTrigger(el, animation, opts);
  });

  // data-text-reveal — raccourci pour le preset "heading"
  root.querySelectorAll("[data-text-reveal]").forEach((el) => {
    const opts = readOpts(el);
    const animation = PRESETS.heading(el, opts);
    attachTrigger(el, animation, opts);
  });

  // data-grid-enter — conteneur, anime chaque data-anim-item enfant
  root.querySelectorAll("[data-grid-enter]").forEach((group) => {
    const items = Array.from(group.querySelectorAll(":scope > [data-anim-item]"));
    if (!items.length) return;

    const presetName = items[0].dataset.animItem;
    const preset = PRESETS[presetName];
    if (!preset) return;

    const opts = readOpts(group);
    const animations = items.map((item) => preset(item, readOpts(item)));
    animations.forEach((a) => a.pause());

    const tl = window.gsap.timeline({ paused: true });
    animations.forEach((a, i) => {
      tl.add(a.play(), i * (opts.stagger ?? 0.1));
    });

    attachTrigger(group, tl, opts);
  });
}