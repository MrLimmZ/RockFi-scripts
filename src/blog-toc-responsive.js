// src/blog-toc-responsive.js
function toggleDesktopTocAttrs() {
  const DESKTOP_MIN = 992; // breakpoint Webflow : début desktop
  const isTabletOrSmaller = window.innerWidth < DESKTOP_MIN;
  const els = document.querySelectorAll(".content_text.is-desktop");

  els.forEach((el) => {
    if (!el.dataset.fsTocSaved) {
      const saved = [];
      Array.prototype.slice.call(el.attributes).forEach((attr) => {
        if (attr.name.startsWith("fs-toc")) {
          saved.push({ name: attr.name, value: attr.value });
        }
      });
      el.dataset.fsTocSaved = JSON.stringify(saved);
    }

    const savedAttrs = el.dataset.fsTocSaved ? JSON.parse(el.dataset.fsTocSaved) : [];

    if (isTabletOrSmaller) {
      savedAttrs.forEach((attr) => el.removeAttribute(attr.name));
    } else {
      savedAttrs.forEach((attr) => {
        if (!el.hasAttribute(attr.name)) el.setAttribute(attr.name, attr.value);
      });
    }
  });
}

export function init() {
  toggleDesktopTocAttrs();
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(toggleDesktopTocAttrs, 150);
  });
}