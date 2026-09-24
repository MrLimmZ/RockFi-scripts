// src/animate/presets.js
// Chaque preset reçoit l'élément cible + les options lues depuis ses
// data-anim-*, et retourne la timeline/tween GSAP correspondante (pas encore
// jouée — scan.js décide du déclenchement via ScrollTrigger).

import { splitWords, splitWordsMasked, getHiddenOffsets } from "./split-text.js";

export const PRESETS = {
  "fade-up": (el, opts) => {
    window.gsap.set(el, { opacity: 0, y: opts.distance ?? 32 });
    return window.gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: opts.duration ?? 0.8,
      delay: opts.delay ?? 0,
      ease: opts.ease ?? "power2.out",
    });
  },

  "fade-in": (el, opts) => {
    window.gsap.set(el, { opacity: 0 });
    return window.gsap.to(el, {
      opacity: 1,
      duration: opts.duration ?? 0.8,
      delay: opts.delay ?? 0,
      ease: opts.ease ?? "power1.out",
    });
  },

  "scale-in": (el, opts) => {
    window.gsap.set(el, { opacity: 0, scale: opts.scale ?? 0.92 });
    return window.gsap.to(el, {
      opacity: 1,
      scale: 1,
      duration: opts.duration ?? 0.8,
      delay: opts.delay ?? 0,
      ease: opts.ease ?? "power2.out",
    });
  },

  // Reveal d'image façon "rideau" simple (scale + fondu) : l'élément doit
  // avoir un wrapper avec overflow:hidden côté CSS (ex: .image_blog).
"image-reveal": (el, opts) => {
  const distance = `${opts.distance ?? 1.5}rem`;
  window.gsap.set(el, { y: distance, opacity: 0.6 });
  return window.gsap.to(el, {
    y: 0,
    opacity: 1,
    duration: opts.duration ?? 2,
    delay: opts.delay ?? 0,
    ease: opts.ease ?? "power3.out",
  });
},

// Anime un nombre de 0 jusqu'à sa valeur finale, avec un pas d'incrément qui
// s'adapte à la magnitude du nombre — un grand nombre (ex: 1500) compte par
// paliers ronds (dizaines/centaines) plutôt que défiler chiffre par chiffre,
// pour rester lisible et avoir un effet de comptage cohérent visuellement,
// peu importe la taille du nombre.
//
// On extrait la partie numérique pure via regex, on anime UN OBJET
// intermédiaire { value: 0 } avec GSAP (pas directement le texte), et à
// chaque frame on arrondit au multiple du pas le plus proche avant
// d'afficher — le pas est choisi parmi une liste de valeurs "rondes"
// (1, 2, 5, 10, 25, 50, 100, 250, 500, 1000...) proche de target/40, pour
// obtenir environ 40 paliers visibles du début à la fin quelle que soit
// l'ampleur du nombre.
"count-up": (el, opts) => {
  const rawText = el.textContent.trim();
  const match = rawText.match(/^([\d\s]+)(.*)$/); // groupe 1 = chiffres/espaces, groupe 2 = tout le reste (suffixe)
  if (!match) return window.gsap.timeline(); // pas de nombre trouvé, no-op sûr

  const targetNumber = parseInt(match[1].replace(/\s/g, ""), 10);
  const suffix = match[2];

  if (isNaN(targetNumber)) return window.gsap.timeline();

  const NICE_STEPS = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
  const idealStep = targetNumber / 40; // ~40 paliers du début à la fin, quel que soit le nombre
  const step = NICE_STEPS.find((s) => s >= idealStep) || NICE_STEPS[NICE_STEPS.length - 1];

  const counter = { value: 0 };
  el.textContent = "0" + suffix;

  return window.gsap.to(counter, {
    value: targetNumber,
    duration: opts.duration ?? 1.5,
    delay: opts.delay ?? 0,
    ease: opts.ease ?? "power1.out",
    onUpdate: () => {
      // Arrondit au multiple du pas le plus proche, sans jamais dépasser
      // targetNumber (dernier tick garanti = valeur finale exacte).
      const stepped = Math.min(Math.round(counter.value / step) * step, targetNumber);
      const formatted = match[1].includes(" ")
        ? stepped.toLocaleString("fr-FR").replace(/,/g, " ").replace(/\u202f/g, " ")
        : String(stepped);
      el.textContent = formatted + suffix;
    },
    onComplete: () => {
      // Filet de sécurité : garantit l'affichage exact de la valeur finale
      // d'origine (avec son formatage/espace tel quel), au cas où
      // l'arrondi par palier laisserait un écart au dernier frame.
      el.textContent = rawText;
    },
  });
},

  // Reveal "rideau" sur une image : une boîte (overflow:hidden) grandit en
  // hauteur de 0 à 100%, révélant l'image du haut vers le bas. L'image
  // garde une hauteur FIXE en pixels égale à celle du wrapper (position
  // absolute), pour ne jamais être étirée/écrasée pendant que la boîte
  // grandit — seule la partie visible change, la boîte agit comme un cache
  // qui se rétracte.
  //
  // Un overlay noir est posé DANS box (donc rogné progressivement en même
  // temps que l'image, pas visible en entier dès le départ) : opacity
  // démarre à 1 (plein noir) et descend à 0 vers la fin de l'animation de
  // hauteur, chevauchement piloté par opts.overlayStart (fraction de la
  // durée totale où le fondu démarre).
  //
  // Le délai (opts.delay, calculé par siblingIndex() dans scan.js pour
  // décaler les éléments d'une même liste) est appliqué sur la TIMELINE
  // entière (gsap.timeline({ delay })), pas sur chaque .to() individuel —
  // sinon, positionnés à des offsets absolus internes à la timeline, ils
  // démarreraient toujours immédiatement au moment où ScrollTrigger
  // déclenche .play(), quel que soit opts.delay.
  //
  // À poser sur le WRAPPER qui contient l'image (pas sur l'<img> lui-même).
  // La hauteur du wrapper est figée explicitement (el.style.height) AVANT
  // de repositionner l'<img> en absolute — sinon, une fois l'image sortie
  // du flux normal, le wrapper (s'il n'a pas de hauteur CSS fixe) s'effondre
  // à 0px. Hauteur mesurée UNE SEULE FOIS à l'init (pas de resize handler).
  "image-wipe": (el, opts) => {
    const img = el.querySelector("img");
    if (!img) return window.gsap.timeline(); // pas d'image trouvée, no-op sûr

    const height = el.offsetHeight;

    if (getComputedStyle(el).position === "static") {
      el.style.position = "relative";
    }
    el.style.overflow = "hidden";
    el.style.height = `${height}px`;

    const box = document.createElement("div");
    box.className = "img-reveal-box";
    Object.assign(box.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "0px",
      overflow: "hidden",
    });

    Object.assign(img.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: `${height}px`,
      objectFit: img.style.objectFit || "cover",
    });

    box.appendChild(img); // déplace l'<img> existante dans la boîte

    const overlay = document.createElement("div");
    overlay.className = "img-reveal-overlay";
    Object.assign(overlay.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: `${height}px`,
      background: opts.overlayColor || "#000",
      opacity: "1",
      pointerEvents: "none",
      zIndex: "1",
    });
    box.appendChild(overlay);

    el.appendChild(box);

    const duration = opts.duration ?? 1.1;
    const overlayStart = opts.overlayStart ?? 0.55;

    const tl = window.gsap.timeline({ delay: opts.delay ?? 0 });
    tl.to(box, { height, duration, ease: opts.ease ?? "power3.inOut" }, 0);
    tl.to(
      overlay,
      { opacity: 0, duration: duration * (1 - overlayStart) + 0.2, ease: "power1.out" },
      duration * overlayStart,
    );

    return tl;
  },

  // Texte révélé mot par mot en fondu simple (opacity/y), sans effet rideau.
  "text-words": (el, opts) => {
    const words = splitWords(el);
    window.gsap.set(words, { opacity: 0, y: 12 });
    return window.gsap.to(words, {
      opacity: 1,
      y: 0,
      duration: opts.duration ?? 0.6,
      delay: opts.delay ?? 0,
      stagger: opts.stagger ?? 0.03,
      ease: opts.ease ?? "power2.out",
    });
  },

  // Titre révélé mot par mot façon "rideau". Déplacement de départ calculé
  // en pixels réels (getHiddenOffsets) plutôt qu'en yPercent — garantit un
  // masquage total même avec le padding ajouté autour de chaque mot pour
  // protéger accents/descendantes.
  heading: (el, opts) => {
    const words = splitWordsMasked(el);
    const offsets = getHiddenOffsets(words);

    window.gsap.set(words, { y: (i) => offsets[i] });

    return window.gsap.to(words, {
      y: 0,
      duration: opts.duration ?? 0.7,
      delay: opts.delay ?? 0,
      stagger: opts.stagger ?? 0.04,
      ease: opts.ease ?? "power3.out",
    });
  },
};