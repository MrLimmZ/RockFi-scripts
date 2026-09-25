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
function runGridReveal(grid, isRefilter = false) {
  const presetName = grid.dataset.gridReveal || "image-reveal";
  const preset = PRESETS[presetName];
  if (!preset) return;

  const opts = readOpts(grid);
  const staggerStep = opts.stagger ?? 0.08;

  // Récupère tous les items CMS
  const allItems = Array.from(
    grid.querySelectorAll(".w-dyn-item, :scope > [data-anim-item], :scope > *")
  );

  // Filtre UNIQUEMENT les cartes actuellement visibles à l'écran
  const visibleItems = allItems.filter((item) => {
    const style = window.getComputedStyle(item);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      item.offsetHeight > 0
    );
  });

  if (!visibleItems.length) return;

  // Tue l'animation précédente si elle tournait
  if (grid._gridRevealTl) {
    grid._gridRevealTl.kill();
    grid._gridRevealTl = null;
  }

  // Détection de la première rangée (offsetTop)
  const firstTop = visibleItems[0].offsetTop;
  const tolerance = 25;

  const firstRowTargets = [];
  const otherTargets = [];

  visibleItems.forEach((item) => {
    const target = item.querySelector("[data-anim-target]") || item;
    const isFirstRow = Math.abs(item.offsetTop - firstTop) <= tolerance;

    if (isFirstRow) {
      firstRowTargets.push(target);
    } else {
      otherTargets.push(target);
    }
  });

  // Lignes suivantes : immédiatement visibles sans animation
  otherTargets.forEach((target) => {
    target.classList.add("--visible");
    window.gsap.set(target, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
  });

  // Construction de la timeline pour la 1ère rangée
  const tl = window.gsap.timeline({ paused: true });
  grid._gridRevealTl = tl;

  firstRowTargets.forEach((target, index) => {
    target.classList.remove("--visible");
    window.gsap.killTweensOf(target);

    const itemAnim = preset(target, { ...opts, delay: 0 });
    tl.add(itemAnim, index * staggerStep);
  });

  // SI RE-FILTRAGE : lance immédiatement l'anim
  if (isRefilter) {
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.play(0);
    return;
  }

  // Comportement standard initial au scroll
  const start = grid.dataset.animStart || "top 95%";

  window.ScrollTrigger.create({
    trigger: grid,
    start,
    fastScrollEnd: true,
    onEnter: (self) => {
      firstRowTargets.forEach((t) => t.classList.add("--visible"));
      const rect = grid.getBoundingClientRect();
      if (self.progress === 1 || rect.bottom < 0) {
        tl.progress(1);
      } else {
        tl.play();
      }
    },
  });

  const rect = grid.getBoundingClientRect();
  const hasAlreadyScrolledPast = window.scrollY > 200 && rect.bottom < 0;

  if (hasAlreadyScrolledPast) {
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.progress(1);
  } else if (rect.top < window.innerHeight) {
    firstRowTargets.forEach((t) => t.classList.add("--visible"));
    tl.play();
  }
}

// -------------------------------------------------------------
// Scanner principal
// -------------------------------------------------------------
export function scanAnimations(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;

  const grids = root.querySelectorAll("[data-grid-reveal]");
  grids.forEach((grid) => runGridReveal(grid, false));

  // --- RE-DECLENCHEMENT AU CHANGEMENT DE FILTRE ---
  if (grids.length) {
    const triggerRefilter = () => {
      // Petite temporisation (50ms) pour laisser Finsweet finir de masquer/afficher les éléments dans le DOM
      setTimeout(() => {
        grids.forEach((grid) => runGridReveal(grid, true));
      }, 50);
    };

    // 1. Écoute native directe sur les formulaires de filtres (Input text + Select ville)
    const filterForms = root.querySelectorAll('[fs-list-element="filters"], form.blog-list_filter-form-flex');
    filterForms.forEach((form) => {
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
            listInstance.addHook("afterRender", () => {
              triggerRefilter();
            });
          }
        });
      },
    ]);
  }

  // 2. data-inview
  root.querySelectorAll("[data-inview]").forEach((el) => {
    const presetName = el.dataset.inview;
    const preset = PRESETS[presetName];
    if (!preset) return;

    const opts = readOpts(el);
    const staggerStep = opts.stagger ?? 0.08;
    const extraDelay = Math.min(siblingIndex(el) * staggerStep, 0.3);
    opts.delay = (opts.delay ?? 0) + extraDelay;

    const animation = preset(el, opts);
    attachTrigger(el, animation, opts);
  });

  // 3. data-text-reveal
  root.querySelectorAll("[data-text-reveal]").forEach((el) => {
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