export function initFitScale() {
  if (document.documentElement.classList.contains("wf-design-mode")) return;

  document.querySelectorAll("[data-fit-scale-wrap]").forEach((wrap) => {
    const row = wrap.querySelector("[data-fit-scale]");
    if (!row) return;

    // Plafond lu depuis --s (une seule source de vérité), avant de basculer en mode JS
    const readMax = () =>
      parseFloat(getComputedStyle(wrap).getPropertyValue("--s")) ||
      parseFloat(row.dataset.fitScaleMax) ||
      1;

    wrap.classList.add("is-fit-ready");

    const update = () => {
      const natural = row.offsetWidth;
      const naturalH = row.offsetHeight;
      const available = wrap.clientWidth;
      if (!natural || !available) return;

      const max = readMax();
      const scale = Math.min(max, available / natural);
      const offsetX = (available - natural * scale) / 2;

      row.style.transform = `translateX(${offsetX}px) scale(${scale})`;
      wrap.style.height = `${naturalH * scale}px`;
    };

    update();
    new ResizeObserver(update).observe(wrap);
    if (document.fonts?.ready) document.fonts.ready.then(update);
  });
}