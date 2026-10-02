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
//
// Les <br> présents dans l'élément source sont conservés : ils servent de
// séparateurs de ligne ET de mots (« Devenir<br>Partner » -> 2 mots).

const MASK_PADDING = "0.3em"; // marge de respiration sur les 4 côtés

// Parcourt les nœuds enfants et renvoie une liste de jetons :
//   { type: "word", text }  un mot
//   { type: "space" }       un espace entre deux mots
//   { type: "br" }          un retour à la ligne
function tokenize(el) {
  const tokens = [];

  const pushText = (text) => {
    text.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (!part.trim()) tokens.push({ type: "space" });
      else tokens.push({ type: "word", text: part });
    });
  };

  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        pushText(child.textContent);
      } else if (child.nodeName === "BR") {
        tokens.push({ type: "br" });
      } else {
        // balise inline (strong, em, a...) : on descend pour garder les <br>
        // éventuels, le style de la balise est perdu (texte seul conservé)
        walk(child);
      }
    });
  };

  walk(el);
  return tokens;
}

export function splitWordsMasked(el) {
  const tokens = tokenize(el);

  el.innerHTML = "";
  const innerEls = [];

  tokens.forEach((token) => {
    if (token.type === "br") {
      el.appendChild(document.createElement("br"));
      return;
    }

    if (token.type === "space") {
      el.appendChild(document.createTextNode(" "));
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
    inner.textContent = token.text;

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
  const tokens = tokenize(el);

  el.innerHTML = "";
  const wordEls = [];

  tokens.forEach((token) => {
    if (token.type === "br") {
      el.appendChild(document.createElement("br"));
      return;
    }

    if (token.type === "space") {
      el.appendChild(document.createTextNode(" "));
      return;
    }

    const span = document.createElement("span");
    span.className = "split-word";
    span.style.display = "inline-block";
    span.textContent = token.text;
    el.appendChild(span);
    wordEls.push(span);
  });

  return wordEls;
}