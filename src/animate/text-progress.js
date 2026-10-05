// src/animate/text-progress.js
// Révélation du texte au scroll : chaque mot passe de l'opacité "from" à 1
// au fil de la progression, du premier au dernier mot.
//
// Attributs (sur l'élément texte) :
//   data-text-progress                 active l'effet
//   data-text-progress-from="0.2"      opacité de départ
//   data-text-progress-start="top 80%" début du trigger
//   data-text-progress-end="bottom 40%" fin du trigger
//   data-text-progress-scrub="1"       lissage (true = collé au scroll)

const DEFAULT_FROM = 0.2;
const DEFAULT_START = "top 80%";
const DEFAULT_END = "bottom 40%";

function num(value, fallback) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

// Découpe en mots en conservant les <br>
function splitWords(el) {
  const words = [];
  const frag = document.createDocumentFragment();

  const walk = (node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (!part.trim()) {
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const span = document.createElement("span");
          span.className = "text-progress_word";
          span.style.display = "inline-block";
          span.textContent = part;
          frag.appendChild(span);
          words.push(span);
        });
      } else if (child.nodeName === "BR") {
        frag.appendChild(document.createElement("br"));
      } else {
        walk(child);
      }
    });
  };

  const label = el.textContent.replace(/\s+/g, " ").trim();
  walk(el);
  el.textContent = "";
  el.appendChild(frag);
  el.setAttribute("aria-label", label);
  words.forEach((w) => w.setAttribute("aria-hidden", "true"));
  return words;
}

export function initTextProgress(root = document) {
  if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  root.querySelectorAll("[data-text-progress]:not([data-text-progress-ready])").forEach((el) => {
    el.setAttribute("data-text-progress-ready", "true");

    const d = el.dataset;
    const words = splitWords(el);
    if (!words.length) return;

    const scrubAttr = d.textProgressScrub;
    const scrub = scrubAttr === undefined ? true : num(scrubAttr, true);

    window.gsap.set(words, { opacity: num(d.textProgressFrom, DEFAULT_FROM) });

    window.gsap.to(words, {
      opacity: 1,
      ease: "none",
      stagger: 1, // une unité par mot : progression mot après mot
      scrollTrigger: {
        trigger: el,
        start: d.textProgressStart || DEFAULT_START,
        end: d.textProgressEnd || DEFAULT_END,
        scrub,
        invalidateOnRefresh: true,
      },
      duration: 1,
    });
  });
}