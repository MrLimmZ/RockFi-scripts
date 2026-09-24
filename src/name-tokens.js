// src/name-tokens.js
// Remplace les jetons {name} et {surname} par le prénom/nom réels, lus
// depuis un élément source déjà affiché sur la page (ex: le <h1> du profil
// conseiller). Scanne AUTOMATIQUEMENT tout le texte de la page (ou d'un
// conteneur donné) à la recherche de ces jetons — aucun attribut à poser
// sur les éléments cibles, juste écrire {name}/{surname} directement dans
// le texte Webflow, où que ce soit.
//
// Découpage : premier mot du nom complet = prénom, tout le reste = nom de
// famille (gère les noms composés comme "Jean-Pierre" ou noms à particule
// comme "de la Fontaine").
//
// Usage HTML :
//   Élément source (une seule fois sur la page) :
//     <h1 data-name-source>Delphine Colin</h1>
//   N'importe où ailleurs sur la page, dans n'importe quel texte :
//     "Contacter {name} {surname}"

function splitFullName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ") || "";
  return { firstName, lastName };
}

// Parcourt uniquement les nœuds TEXTE (pas les attributs, pas le HTML) —
// évite de toucher aux scripts, styles, ou attributs qui contiendraient
// accidentellement ces mêmes séquences de caractères.
function walkTextNodes(root, callback) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Ignore le texte à l'intérieur de <script> et <style>.
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

  const fullName = sourceEl.textContent.trim();
  const { firstName, lastName } = splitFullName(fullName);

  const scanRoot = root === document ? document.body : root;

  walkTextNodes(scanRoot, (node) => {
    if (node.nodeValue.includes("{name}") || node.nodeValue.includes("{surname}")) {
      node.nodeValue = node.nodeValue.replace(/\{name\}/g, firstName).replace(/\{surname\}/g, lastName);
    }
  });
}