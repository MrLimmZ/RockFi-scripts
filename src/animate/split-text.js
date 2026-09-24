// src/animate/split-text.js
// Découpe un élément texte en mots masqués individuellement, pour un effet
// "rideau" révélé mot par mot. Chaque mot est enveloppé dans un mask
// (overflow:hidden) avec du padding sur les 4 côtés + un margin négatif
// équivalent, pour ne pas rogner les accents/hampes montantes en haut ni
// les descendantes (g, q, y, j...) en bas.
//
// Le déplacement de départ (état caché) est calculé en PIXELS, à partir de
// la hauteur RÉELLE du mask une fois posé dans le DOM (mask.offsetHeight),
// plutôt qu'un yPercent basé sur la hauteur du mot lui-même — un yPercent
// ne connaît pas le padding ajouté autour, donc le déplacement se
// retrouvait insuffisant pour sortir complètement de la fenêtre visible
// une fois le padding pris en compte, laissant le haut des lettres
// (accents) visible même à l'état "caché".

const MASK_PADDING = "0.3em"; // marge de respiration sur les 4 côtés

export function splitWordsMasked(el) {
  const text = el.textContent;
  const words = text.split(/(\s+)/); // garde les séparateurs dans le tableau

  el.innerHTML = "";
  const innerEls = [];

  words.forEach((word) => {
    if (!word.trim()) {
      el.appendChild(document.createTextNode(word)); // espace, réinséré tel quel
      return;
    }

    const mask = document.createElement("span");
    mask.className = "split-word-mask";
    mask.style.display = "inline-block";
    mask.style.overflow = "hidden";
    mask.style.verticalAlign = "top";
    mask.style.padding = MASK_PADDING;
    mask.style.margin = `-${MASK_PADDING}`;

    const inner = document.createElement("span");
    inner.className = "split-word-inner";
    inner.style.display = "inline-block";
    inner.textContent = word;

    mask.appendChild(inner);
    el.appendChild(mask);
    innerEls.push(inner);
  });

  return innerEls;
}

// À appeler juste après avoir posé les mots dans le DOM (une fois le layout
// calculé), pour connaître leur position de départ (état caché) en pixels
// réels — basé sur la hauteur totale du mask (padding compris), pas sur
// yPercent qui ignorerait ce padding.
export function getHiddenOffsets(innerEls) {
  return innerEls.map((inner) => {
    const mask = inner.parentElement;
    return mask.offsetHeight; // hauteur totale du mask, padding inclus
  });
}

// Simple découpe en mots, sans masque (pour le preset "text-words", qui
// anime en opacity/y plutôt qu'en rideau — pas besoin d'overflow:hidden).
export function splitWords(el) {
  const text = el.textContent;
  const words = text.split(/(\s+)/);

  el.innerHTML = words
    .map((word) => (word.trim() ? `<span class="split-word" style="display:inline-block">${word}</span>` : word))
    .join("");

  return Array.from(el.querySelectorAll(".split-word"));
}