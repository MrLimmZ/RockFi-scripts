// src/embeds/list-enhance.js
// [list]
// Premier point
// [b]Exemple n°1 :[/b] reste du texte en couleur normale sauf cette partie
// [/list]
// Une ligne = un item. [b]...[/b] à l'intérieur d'une ligne passe cette
// portion en couleur foncée (text-primary), sans graisse, le reste garde le
// style courant de la liste (black-70).
// Enveloppé dans .rf-wrap pour être centré/limité à 794px sur desktop,
// comme les tableaux (voir blog.scss, section "Embeds de contenu").

const LIST_BLOCK_REGEX =
  /(?:<p>)?\[list\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/list\](?:<\/p>)?/gi;

const BOLD_REGEX = /\[b\](.*?)\[\/b\]/gi;

function applyBold(text) {
  return text.replace(BOLD_REGEX, '<strong class="rt-bold">$1</strong>');
}

export function initListEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!LIST_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  LIST_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(LIST_BLOCK_REGEX, (match, body) => {
    const items = body
      .replace(/<\/p>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!items.length) return match;

    const itemsHTML = items
      .map(
        (item) => `
          <li class="rt-list-item">
            <span class="rt-list-bullet" aria-hidden="true"></span>
            <span class="rt-list-content">${applyBold(item)}</span>
          </li>
        `,
      )
      .join("");

    return `<div class="rf-wrap"><ul class="rt-list rt-text" role="list">${itemsHTML}</ul></div>`;
  });
}