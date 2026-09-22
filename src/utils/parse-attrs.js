// src/embeds/utils/parse-attrs.js
// Parse les attributs type key="value" d'un shortcode.
// Ex: ' href="/contact" style="secondary"' -> { href: "/contact", style: "secondary" }

const ATTR_REGEX = /(\w+)="([^"]*)"/g;

export function parseAttrs(attrString = "") {
  const attrs = {};
  let match;
  ATTR_REGEX.lastIndex = 0;
  while ((match = ATTR_REGEX.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}