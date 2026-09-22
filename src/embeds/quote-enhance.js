// src/embeds/quote-enhance.js
// [quote img="https://..." name="Maxime Durand" role="Co-fondateur, RockFi"]
// Texte de la citation
// [/quote]
// img/name/role optionnels. Le lookahead (?=[\s\]]) après "quote" évite de
// matcher [quote-large]. Guillemets typographiques ajoutés automatiquement
// au début et à la fin du texte. Enveloppé dans .rf-wrap comme les autres blocs.

import { parseAttrs } from "../utils/parse-attrs.js";

const QUOTE_BLOCK_REGEX =
  /(?:<p>)?\[quote(?=[\s\]])([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote\](?:<\/p>)?/gi;

export function initQuoteEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!QUOTE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  QUOTE_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(
    QUOTE_BLOCK_REGEX,
    (match, attrString, body) => {
      const attrs = parseAttrs(attrString);
      const text = body
        .replace(/<\/p>|<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .trim();
      if (!text) return match;

      const name = attrs.name || "";
      const role = attrs.role || "";
      const img = attrs.img || "";

      const authorHTML =
        name || img
          ? `
            <div class="rt-quote-author">
              ${img ? `<img src="${img}" alt="${name}" class="rt-quote-avatar">` : ""}
              <div class="rt-quote-author-info">
                ${name ? `<p class="rt-quote-name">${name}</p>` : ""}
                ${role ? `<p class="rt-quote-role">${role}</p>` : ""}
              </div>
            </div>
          `
          : "";

      return `
        <div class="rf-wrap">
          <div class="rt-quote">
            <p class="rt-quote-text">&ldquo;${text}&rdquo;</p>
            ${authorHTML}
          </div>
        </div>
      `;
    },
  );
}