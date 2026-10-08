// src/animate/scan.js
// Lit les attributs data-inview / data-text-reveal / data-grid-enter / data-grid-reveal du DOM
// et déclenche l'animation GSAP correspondante au scroll via ScrollTrigger.
// Compatible Finsweet Attributes v2 (fs-list).

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

  return 0;
}

function attachTrigger(el, animation, opts) {
  const start = el.dataset.animStart || "top 85%";
  const repeat = el.dataset.animRepeat === "true";

  animation.pause();

  window.ScrollTrigger.create({
    trigger: el,
    start,
    fastScrollEnd: true,
    onEnter: (self) => {
      el.classList.add("--visible");
      if (self.progress === 1 || el.getBoundingClientRect().bottom < 0) {
        animation.progress(1);
      } else {
        animation.play();
      }
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

  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight && rect.bottom > 0) {
    el.classList.add("--visible");
    animation.play();
  } else if (rect.bottom <= 0 && window.scrollY > 200) {
    el.classList.add("--visible");
    animation.progress(1);
  }
}

// -------------------------------------------------------------
// Logique data-grid-reveal (réutilisable au filtrage)
// -------------------------------------------------------------

// Enfants DIRECTS de la grille uniquement. Avant, ".w-dyn-item" attrapait aussi les
// listes imbriquées (les tags de ville dans chaque carte), qui étaient animés en plus.
function getGridItems(grid) {
  let items = Array.from(grid.querySelectorAll(":scope > .w-dyn-item, :scope > [data-anim-item]"));
  if (!items.length) items = Array.from(grid.querySelectorAll(":scope > *"));
  return items;
}

function isShown(item) {
  const style = window.getComputedStyle(item);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    item.offsetHeight > 0
  );
}

// Identifiant stable d'une carte (lien, sinon début du texte)
function itemKey(item) {
  const link = item.querySelector("a[href]");
  return (link && link.getAttribute("href")) || (item.textContent || "").trim().slice(0, 40);
}

function runGridReveal(grid, isRefilter = false) {
  const presetName = grid.dataset.gridReveal || "image-reveal";
  const preset = PRESETS[presetName];
  if (!preset) return;

  const opts = readOpts(grid);
  const staggerStep = opts.stagger ?? 0.08;

  // Filtre UNIQUEMENT les cartes actuellement visibles à l'écran
  const visibleItems = getGridItems(grid).filter(isShown);
  if (!visibleItems.length) return;

  // Détection de la première rangée
  const rowTop = (item) => item.getBoundingClientRect().top;
  const firstTop = rowTop(visibleItems[0]);
  const tolerance = 25;

  const firstRowItems = visibleItems.filter((item) => Math.abs(rowTop(item) - firstTop) <= tolerance);
  const otherItems = visibleItems.filter((item) => !firstRowItems.includes(item));

  // Re-rendu Finsweet / "Afficher plus" / saisie : si la 1re rangée affichée est la même
  // qu'avant, il n'y a rien à rejouer. C'est ce qui relançait l'animation 2-3 fois au chargement.
  const signature = firstRowItems.map(itemKey).join("|");
  if (isRefilter && grid._gridSig === signature) return;
  grid._gridSig = signature;

  const toTarget = (item) => item.querySelector("[data-anim-target]") || item;
  const firstRowTargets = firstRowItems.map(toTarget);
  const otherTargets = otherItems.map(toTarget);

  // Tue l'animation précédente si elle tournait
  if (grid._gridRevealTl) {
    grid._gridRevealTl.kill();
    grid._gridRevealTl = null;
  }

  // Lignes suivantes : immédiatement visibles sans animation
  otherTargets.forEach((target) => {
    target.classList.add("--visible");
    window.gsap.set(target, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
  });

  // Construction de la timeline pour la 1ère rangée
  const tl = window.gsap.timeline({ paused: true });
  grid._gridRevealTl = tl;
  grid._gridFirstRow = firstRowTargets;

  firstRowTargets.forEach((target, index) => {
    target.classList.remove("--visible");
    window.gsap.killTweensOf(target);

    const itemAnim = preset(target, { ...opts, delay: 0 });
    tl.add(itemAnim, index * staggerStep);
  });

  // RE-FILTRAGE alors que la grille est déjà entrée à l'écran : on rejoue tout de suite
  if (isRefilter && grid._gridEntered) {
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.play(0);
    return;
  }

  // Déclencheur d'entrée : créé UNE seule fois par grille, il lit toujours la timeline courante
  if (!grid._gridTrigger) {
    const start = grid.dataset.animStart || "top 95%";

    grid._gridTrigger = window.ScrollTrigger.create({
      trigger: grid,
      start,
      fastScrollEnd: true,
      once: true,
      onEnter: (self) => {
        grid._gridEntered = true;
        const current = grid._gridRevealTl;
        if (!current) return;
        (grid._gridFirstRow || []).forEach((t) => t.classList.add("--visible"));
        if (self.progress === 1 || grid.getBoundingClientRect().bottom < 0) {
          current.progress(1);
        } else {
          current.play();
        }
      },
    });
  }

  // Grille déjà à l'écran (ou déjà dépassée) au moment du calcul
  if (grid._gridEntered) return;

  const rect = grid.getBoundingClientRect();
  const hasAlreadyScrolledPast = window.scrollY > 200 && rect.bottom < 0;

  if (hasAlreadyScrolledPast) {
    grid._gridEntered = true;
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.progress(1);
  } else if (rect.top < window.innerHeight) {
    grid._gridEntered = true;
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.play();
  }
}

// -------------------------------------------------------------
// Re-déclenchement au changement de filtre (branché UNE seule fois)
// -------------------------------------------------------------
let refilterBound = false;
let refilterTimer = null;

// Une même action (saisie, select, rendu Finsweet) déclenche plusieurs événements :
// on les regroupe en un seul passage.
function triggerRefilter() {
  clearTimeout(refilterTimer);
  refilterTimer = setTimeout(() => {
    document.querySelectorAll("[data-grid-reveal]").forEach((grid) => runGridReveal(grid, true));
  }, 120);
}

function bindRefilter(root) {
  if (refilterBound) return;
  refilterBound = true;

  // 1. Écoute native directe sur les formulaires de filtres (Input text + Select ville)
  root
    .querySelectorAll('[fs-list-element="filters"], form.blog-list_filter-form-flex')
    .forEach((form) => {
      form.addEventListener("change", triggerRefilter);
      form.addEventListener("input", triggerRefilter);
      form.addEventListener("reset", triggerRefilter);
    });

  // 2. Écoute du bouton "Réinitialiser" Finsweet
  root.querySelectorAll('[fs-list-element="clear"]').forEach((btn) => {
    btn.addEventListener("click", triggerRefilter);
  });

  // 3. API Finsweet Attributes v2 (Hook 'afterRender' officiel)
  window.FinsweetAttributes = window.FinsweetAttributes || [];
  window.FinsweetAttributes.push([
    "list",
    (listInstances) => {
      listInstances.forEach((listInstance) => {
        if (typeof listInstance.addHook === "function") {
          listInstance.addHook("afterRender", triggerRefilter);
        }
      });
    },
  ]);
}

// -------------------------------------------------------------
// Scanner principal
// -------------------------------------------------------------
export function scanAnimations(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  // Chaque élément n'est traité qu'une fois, même si scanAnimations() est rappelée
  const claim = (el) => {
    if (el.dataset.animBound === "true") return false;
    el.dataset.animBound = "true";
    return true;
  };

  const grids = Array.from(root.querySelectorAll("[data-grid-reveal]"));
  grids.forEach((grid) => {
    if (claim(grid)) runGridReveal(grid, false);
  });
  if (grids.length) bindRefilter(root);

  // 2. data-inview
  root.querySelectorAll("[data-inview]").forEach((el) => {
    const presetName = el.dataset.inview;
    const preset = PRESETS[presetName];
    if (!preset) return;
    if (!claim(el)) return;

    const opts = readOpts(el);

    // Réglages de décalage par preset : seul count-up est décalé plus fort,
    // tous les autres presets gardent exactement l'ancien comportement.
    const STAGGER_BY_PRESET = {
      "count-up": { step: 0.25, max: 1 },
    };
    const cfg = STAGGER_BY_PRESET[presetName] || { step: 0.08, max: 0.3 };

    const staggerStep = opts.stagger ?? cfg.step;
    const extraDelay = Math.min(siblingIndex(el) * staggerStep, cfg.max);
    opts.delay = (opts.delay ?? 0) + extraDelay;

    const animation = preset(el, opts);
    attachTrigger(el, animation, opts);
  });

  // 3. data-text-reveal
  root.querySelectorAll("[data-text-reveal]").forEach((el) => {
    if (!claim(el)) return;
    const opts = readOpts(el);
    const animation = PRESETS.heading(el, opts);
    attachTrigger(el, animation, opts);
  });

  // 4. data-grid-enter
  root.querySelectorAll("[data-grid-enter]").forEach((group) => {
    const items = Array.from(group.querySelectorAll(":scope > [data-anim-item]"));
    if (!items.length) return;

    const presetName = items[0].dataset.animItem;
    const preset = PRESETS[presetName];
    if (!preset) return;
    if (!claim(group)) return;

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