// src/collapse.js
// Squelette repris de la structure Overflo — à adapter aux besoins de RockFi.

function initCollapses() {
  const collapses = document.querySelectorAll("[data-collapse]");

  collapses.forEach((el) => {
    const trigger = el.querySelector("[data-collapse-trigger]");
    const content = el.querySelector("[data-collapse-content]");
    if (!trigger || !content) return;

    trigger.addEventListener("click", () => {
      const isOpen = el.classList.contains("is-open");
      el.classList.toggle("is-open", !isOpen);
    });
  });
}

document.addEventListener("DOMContentLoaded", initCollapses);

export { initCollapses };
