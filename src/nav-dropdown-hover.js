// src/nav-dropdown-hover.js

import { getLenis } from "./core.js";

export function initNavDropdownHover() {
  const CLOSE_DELAY = 200;
  const mq = window.matchMedia("(hover: hover) and (min-width: 992px)");

  const nav = document.querySelector(".nav_fixed");
  const dropdowns = document.querySelectorAll(".nav_fixed .w-dropdown");

  if (!nav || !dropdowns.length) return;

  setupScrollLock(nav);

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".w-dropdown-toggle");
    const list = dropdown.querySelector(".w-dropdown-list");
    if (!toggle || !list) return;

    let closeTimer = null;
    const isOpen = () => toggle.classList.contains("w--open");

    function setOpen(open) {
      toggle.classList.toggle("w--open", open);
      list.classList.toggle("w--open", open);
      toggle.setAttribute("aria-expanded", String(open));
      dropdown.style.zIndex = open ? "901" : "";
    }

    dropdown.addEventListener("mouseenter", () => {
      if (!mq.matches) return;
      clearTimeout(closeTimer);
      if (!isOpen()) setOpen(true);
    });

    dropdown.addEventListener("mouseleave", () => {
      if (!mq.matches) return;
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        if (isOpen()) setOpen(false);
      }, CLOSE_DELAY);
    });

    toggle.addEventListener(
      "click",
      (e) => {
        if (mq.matches && e.isTrusted) {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
      },
      true,
    );
  });
}

function setupScrollLock(nav) {
  const root = document.documentElement;
  let locked = false;

  function lock() {
    if (locked) return;
    locked = true;
    root.style.scrollbarGutter = "stable";
    root.style.overflow = "hidden";
    getLenis()?.stop();
  }

  function unlock() {
    if (!locked) return;
    locked = false;
    root.style.overflow = "";
    root.style.scrollbarGutter = "";
    getLenis()?.start();
  }

  function sync() {
    const anyOpen = nav.querySelector(
      ".navbar_menu-button.w--open, .w-dropdown-toggle.w--open",
    );
    if (anyOpen) lock();
    else unlock();
  }

  new MutationObserver(sync).observe(nav, {
    subtree: true,
    attributes: true,
    attributeFilter: ["class"],
  });

  sync();
}