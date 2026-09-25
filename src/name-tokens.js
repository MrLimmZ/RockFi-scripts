// src/name-tokens.js
// Remplace les jetons {name} et {surname} par le prénom/nom réels, lus
// depuis la valeur de l'attribut [data-name-source="..."] (ex: data-name-source="Delphine Colin").
//
// Usage HTML :
//   <div data-name-source="Delphine Colin"></div>
//   Ou sur n'importe quel élément :
//   <h1 data-name-source="Delphine Colin">...</h1>

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

function walkTextNodes(root, callback) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement ? node.parentElement.tagName : "";
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    callback(node);
  }
}

export function initNameTokens(root = document) {
  const sourceEl = root.querySelector("[data-name-source]");
  if (!sourceEl) return;

  // Récupère la valeur dans l'attribut data-name-source (avec repli sur textContent si vide)
  const attrValue = sourceEl.getAttribute("data-name-source") || "";
  const fullName = (attrValue.trim() || sourceEl.textContent).trim();

  if (!fullName) return;

  const { firstName, lastName } = splitFullName(fullName);
  const scanRoot = root === document ? document.body : root;

  walkTextNodes(scanRoot, (node) => {
    if (node.nodeValue.includes("{name}") || node.nodeValue.includes("{surname}")) {
      node.nodeValue = node.nodeValue
        .replace(/\{name\}/g, firstName)
        .replace(/\{surname\}/g, lastName);
    }
  });
}