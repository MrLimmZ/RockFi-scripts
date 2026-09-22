// src/embeds/slider-enhance.js
// [slider]
// https://.../img1.jpg | Légende 1
// https://.../img2.jpg
// [/slider]
// Une ligne = une image. "| légende" optionnel après l'URL.
// Slider maison "peek" avec drag souris/tactile + snap magnétique.
// Pas de .rf-wrap : largeur pleine de .rich-text_blog.

const SLIDER_BLOCK_REGEX =
  /(?:<p>)?\[slider\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/slider\](?:<\/p>)?/gi;

const CHEVRON_SVG =
  '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.00003 4L10 8L6 12" stroke="#1A1A1A" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function buildSlidesHTML(body) {
  const lines = body
    .replace(/<\/p>|<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      const url = parts[0];
      const caption = parts[1] || "";
      if (!url) return "";

      const captionHTML = caption
        ? `<figcaption class="rt-slider-caption">${caption}</figcaption>`
        : "";

      return `
        <div class="rt-slider-item">
          <img src="${url}" alt="${caption}" loading="lazy" draggable="false">
          ${captionHTML}
        </div>
      `;
    })
    .join("");
}

function initOneSlider(el) {
  const track = el.querySelector(".rt-slider-track");
  const items = Array.from(el.querySelectorAll(".rt-slider-item"));
  const prevBtn = el.querySelector(".rt-slider-prev");
  const nextBtn = el.querySelector(".rt-slider-next");
  if (!track || !items.length) return;

  let index = 0;
  let currentOffset = 0;
  let isDragging = false;
  let startX = 0;
  let startOffset = 0;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;

  const RESISTANCE = 3;
  const SWIPE_THRESHOLD_RATIO = 0.15;
  const FLICK_VELOCITY = 0.5;
  const TRANSITION = "transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)";

  function getMaxOffset() {
    return Math.max(0, track.scrollWidth - el.clientWidth);
  }

  // Lit la position RÉELLEMENT affichée à l'écran (via la matrice de
  // transform calculée par le navigateur), indépendamment d'une transition
  // CSS en cours — contrairement à currentOffset qui, lui, est déjà mis à
  // jour sur la valeur CIBLE dès l'appel de setOffset, avant même que
  // l'animation visuelle ait fini de s'y rendre.
  function getLiveOffset() {
    const style = window.getComputedStyle(track);
    const matrix = new DOMMatrixReadOnly(style.transform);
    return -matrix.m41;
  }

  function setOffset(offset, withTransition) {
    track.style.transition = withTransition ? TRANSITION : "none";
    currentOffset = offset;
    track.style.transform = `translateX(-${offset}px)`;
  }

  function goToIndex(i, withTransition = true) {
    index = Math.min(Math.max(i, 0), items.length - 1);
    const maxOffset = getMaxOffset();
    const target = Math.min(items[index].offsetLeft, maxOffset);
    setOffset(target, withTransition);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === items.length - 1;
  }

  if (prevBtn) prevBtn.addEventListener("click", () => goToIndex(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goToIndex(index + 1));

  track.addEventListener("pointerdown", (e) => {
    // Interrompt une transition éventuellement en cours : on fige le track à
    // sa position RÉELLE affichée à l'écran à cet instant (pas la valeur
    // cible mémorisée dans currentOffset), sinon le nouveau drag démarre
    // depuis le mauvais point et ça "saute" visuellement.
    const liveOffset = getLiveOffset();
    track.style.transition = "none";
    track.style.transform = `translateX(-${liveOffset}px)`;
    currentOffset = liveOffset;

    isDragging = true;
    startX = e.clientX;
    startOffset = currentOffset;
    lastX = e.clientX;
    lastTime = performance.now();
    velocity = 0;
    track.classList.add("is-dragging");
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const now = performance.now();
    const dt = now - lastTime;
    if (dt > 0) velocity = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastTime = now;

    const delta = e.clientX - startX;
    let proposed = startOffset - delta;
    const maxOffset = getMaxOffset();

    if (proposed < 0) {
      proposed = proposed / RESISTANCE;
    } else if (proposed > maxOffset) {
      proposed = maxOffset + (proposed - maxOffset) / RESISTANCE;
    }

    setOffset(proposed, false);
  });

  function endDrag(e) {
    if (!isDragging) return;
    isDragging = false;
    track.classList.remove("is-dragging");

    const finalX = e.clientX ?? lastX;
    const deltaX = finalX - startX;
    const threshold = Math.min(el.clientWidth * SWIPE_THRESHOLD_RATIO, 100);
    const isFlick = Math.abs(velocity) > FLICK_VELOCITY;

    if (Math.abs(deltaX) > threshold || isFlick) {
      const direction = deltaX > 0 || (isFlick && velocity > 0) ? -1 : 1;
      goToIndex(index + direction, true);
    } else {
      goToIndex(index, true);
    }
  }

  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goToIndex(index, false), 150);
  });

  goToIndex(0, false);
}

export function initSliderEnhance(root = document) {
  const contentEl = root.querySelector(".rich-text_blog");
  if (!contentEl) return;

  if (!SLIDER_BLOCK_REGEX.test(contentEl.innerHTML)) return;
  SLIDER_BLOCK_REGEX.lastIndex = 0;

  contentEl.innerHTML = contentEl.innerHTML.replace(SLIDER_BLOCK_REGEX, (match, body) => {
    const slidesHTML = buildSlidesHTML(body);
    if (!slidesHTML) return match;

    return `
      <div class="rt-slider">
        <div class="rt-slider-track">${slidesHTML}</div>
        <div class="rt-slider-controls">
          <button type="button" class="rt-slider-prev" aria-label="Image précédente">${CHEVRON_SVG}</button>
          <button type="button" class="rt-slider-next" aria-label="Image suivante">${CHEVRON_SVG}</button>
        </div>
      </div>
    `;
  });

  contentEl.querySelectorAll(".rt-slider:not([data-slider-initialized])").forEach((el) => {
    el.setAttribute("data-slider-initialized", "true");
    initOneSlider(el);
  });
}