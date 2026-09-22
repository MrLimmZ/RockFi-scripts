// src/embeds/quote-large-enhance.js
// [quote-large]Un cadre au service de votre liberté, des outils au service de votre performance.[/quote-large]
// Guillemets ajoutés automatiquement. Enveloppé dans .rf-wrap comme les autres blocs.

const QUOTE_LARGE_BLOCK_REGEX =
  /(?:<p>)?\[quote-large\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote-large\](?:<\/p>)?/gi;

export function initQuoteLargeEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!QUOTE_LARGE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  QUOTE_LARGE_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(QUOTE_LARGE_BLOCK_REGEX, (match, body) => {
    const text = body
      .replace(/<\/p>|<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, "")
      .trim();
    if (!text) return match;

    return `
      <div class="rf-wrap">
        <blockquote class="rt-quote-large">&ldquo;${text}&rdquo;</blockquote>
      </div>
    `;
  });
}