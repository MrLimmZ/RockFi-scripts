// src/animate/blur-placeholder.js
// Placeholder flou le temps du chargement d'une image.
// Usage HTML : data-blur sur l'<img> (elle doit avoir un srcset Webflow).
// Options : data-blur-amount="20" (px de flou)
//           data-blur-duration="0.6" (s, fondu de sortie)

function initOne(img) {
  const srcset = img.getAttribute("srcset");
  if (!srcset) return;

  // Webflow liste les variantes de la plus petite a la plus grande
  const smallest = srcset.split(",")[0].trim().split(" ")[0];
  if (!smallest) return;

  const parent = img.parentElement;
  if (!parent) return;

  // Deja charge (cache) : rien a faire
  if (img.complete && img.naturalWidth > 0) return;

  if (getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }
  parent.style.overflow = "hidden";

  const amount = parseFloat(img.dataset.blurAmount) || 20;
  const duration = parseFloat(img.dataset.blurDuration) || 0.6;

  const ph = document.createElement("div");
  Object.assign(ph.style, {
    position: "absolute",
    inset: "0",
    backgroundImage: `url("${smallest}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: `blur(${amount}px)`,
    transform: "scale(1.1)", // evite les bords clairs dus au flou
    transition: `opacity ${duration}s ease`,
    pointerEvents: "none",
  });

  // Insere AVANT l'image : l'image (ou son parallax) reste au-dessus
  parent.insertBefore(ph, img);

  const done = () => {
    ph.style.opacity = "0";
    setTimeout(() => ph.remove(), duration * 1000 + 50);
  };

  if (img.decode) img.decode().then(done).catch(done);
  else img.addEventListener("load", done, { once: true });
  img.addEventListener("error", done, { once: true });
}

export function initBlurPlaceholders(root = document) {
  root.querySelectorAll("img[data-blur]").forEach(initOne);
}