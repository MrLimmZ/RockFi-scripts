// src/embeds/calc-enhance.js
// [calc]
// title:Calcul pour Marie
//
// Capital pondéré = 100 000 €
// Taux = 10 000 / 100 000 = +10,0 %
//
// title:Calcul pour Paul
//
// Poids du versement de décembre = (365 − 335) / 365 ≈ 0,082
// Capital Pondéré = 20 000 + (80 000 × 0,082) = 20 000 + 6 560 = 26 560 €
// Taux = 10 000 / 26 560 ≈ +37,6 %
//
// ---
//
// Autrement dit, Paul a immobilisé en moyenne 26 560 € sur l'année.
// [/calc]
//
// "title:xxx" ouvre un sous-bloc. "---" marque le début de la note finale,
// rendue comme un footer avec bordure haute (pas un <hr>). Enveloppé dans
// .rf-wrap comme table/list.

const CALC_BLOCK_REGEX =
  /(?:<p>)?\[calc\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/calc\](?:<\/p>)?/gi;

export function initCalcEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!CALC_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  CALC_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(CALC_BLOCK_REGEX, (match, body) => {
    const lines = body
      .replace(/<\/p>|<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) return match;

    const blocks = [];
    const noteLines = [];
    let currentBlock = null;
    let afterSeparator = false;

    lines.forEach((line) => {
      if (/^title:/i.test(line)) {
        currentBlock = { title: line.replace(/^title:/i, "").trim(), lines: [] };
        blocks.push(currentBlock);
        return;
      }
      if (/^-{3,}$/.test(line)) {
        afterSeparator = true;
        return;
      }
      if (afterSeparator) {
        noteLines.push(line);
        return;
      }
      if (currentBlock) {
        currentBlock.lines.push(line);
      }
    });

    const blocksHTML = blocks
      .map(
        (block) => `
          <div class="rt-calc-block">
            <h4 class="rt-calc-title">${block.title}</h4>
            ${block.lines.map((l) => `<p class="rt-calc-line">${l}</p>`).join("")}
          </div>
        `,
      )
      .join("");

    const footerHTML = noteLines.length
      ? `
        <div class="rt-calc-footer">
          <p class="rt-calc-note">${noteLines.join(" ")}</p>
        </div>
      `
      : "";

    return `
      <div class="rf-wrap">
        <div class="rt-calc">
          ${blocksHTML}
          ${footerHTML}
        </div>
      </div>
    `;
  });
}