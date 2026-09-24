// src/embeds/table-enhance.js

const TABLE_BLOCK_REGEX =
  /(?:<p>)?\[table(\s+split)?\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/table\](?:<\/p>)?/gi;

function cleanRow(line) {
  return line.split(",").map((cell) => cell.trim());
}

export function transformTable(html) {
  return html.replace(TABLE_BLOCK_REGEX, (match, splitFlag, body) => {
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
      <div class="rt-table-wrap blog-embed_wrapper">
        <table class="rt-table${useSplit ? " rt-table--split" : ""}">
          <thead>${theadHTML}</thead>
          <tbody>${tbodyHTML}</tbody>
        </table>
      </div>
    `;
  });
}