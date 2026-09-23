const QUOTE_LARGE_BLOCK_REGEX =
  /(?:<p>)?\[quote-large\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote-large\](?:<\/p>)?/gi;

export function transformQuoteLarge(html) {
  return html.replace(QUOTE_LARGE_BLOCK_REGEX, (match, body) => {
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