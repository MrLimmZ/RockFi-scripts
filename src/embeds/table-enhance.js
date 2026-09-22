// src/embeds/table-enhance.js
// [table split]
// , Prix, Durée
// Assurance vie, 0.5%, 8 ans
// PER, 0.7%, jusqu'à la retraite
// [/table]
//
// "split" optionnel : la 1ère cellule de chaque ligne de contenu devient
// <th scope="row"> (au lieu d'un simple <td>).
// Pour une cellule de header vide (coin en haut à gauche), laisse-la vide
// avant la virgule, comme dans l'exemple ci-dessus.
// ⚠️ Plus d'attribut caption : [table caption="..."] n'est plus reconnu,
// utilise juste [table] ou [table split].

const TABLE_BLOCK_REGEX =
  /(?:<p>)?\[table(\s+split)?\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/table\](?:<\/p>)?/gi;

function cleanRow(line) {
  return line.split(",").map((cell) => cell.trim());
}

export function initTableEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!TABLE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  TABLE_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(
    TABLE_BLOCK_REGEX,
    (match, splitFlag, body) => {
      const useSplit = Boolean(splitFlag);

      const rows = body
        .replace(/<\/p>|<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map(cleanRow);

      if (!rows.length) return match;

      const [headerRow, ...bodyRows] = rows;

      const theadHTML = `<tr>${headerRow
        .map((cell) => `<th scope="col">${cell}</th>`)
        .join("")}</tr>`;

      const tbodyHTML = bodyRows
        .map((row) => {
          if (!useSplit) {
            return `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
          }

          const [rowHeader, ...rest] = row;
          const cellsHTML = rest.map((cell) => `<td>${cell}</td>`).join("");

          return `<tr><th scope="row">${rowHeader}</th>${cellsHTML}</tr>`;
        })
        .join("");

      return `
        <div class="rt-table-wrap rf-wrap">
          <table class="rt-table${useSplit ? " rt-table--split" : ""}">
            <thead>${theadHTML}</thead>
            <tbody>${tbodyHTML}</tbody>
          </table>
        </div>
      `;
    },
  );
}