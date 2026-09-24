// src/blog-toc.js

import { getLenis } from "./core.js";

const NAV_OFFSET_DESKTOP = 164;
const NAV_OFFSET_MOBILE = 164;
const TOC_LABEL_REGEX = /\s*\[toc:([^\]]+)\]\s*$/i;
const TOC_SKIP_VALUE = "-";
const DESKTOP_MIN = 992;

const CHEVRON_SVG =
  '<svg class="toc-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function getNavOffset() {
  return window.innerWidth < DESKTOP_MIN ? NAV_OFFSET_MOBILE : NAV_OFFSET_DESKTOP;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractTocLabel(heading) {
  const rawText = heading.textContent;
  const match = rawText.match(TOC_LABEL_REGEX);

  if (!match) {
    return { label: rawText.trim(), skip: false };
  }

  const cleanText = rawText.replace(TOC_LABEL_REGEX, "").trim();
  heading.textContent = cleanText;

  const value = match[1].trim();
  if (value === TOC_SKIP_VALUE) {
    return { label: null, skip: true };
  }

  return { label: value, skip: false };
}

function wrapSections(root) {
  const headings = Array.from(root.querySelectorAll(":scope > h2"));

  return headings.map((heading) => {
    const { label, skip } = extractTocLabel(heading);

    const baseId = slugify(heading.textContent);
    let id = baseId;
    let n = 1;
    while (document.getElementById(id)) {
      id = `${baseId}-${n}`;
      n += 1;
    }

    const wrapper = document.createElement("div");
    wrapper.id = id;
    wrapper.dataset.tocSkip = skip ? "true" : "false";
    if (label) wrapper.dataset.tocLabel = label;
    wrapper.style.scrollMarginTop = "5rem";

    heading.before(wrapper);
    wrapper.appendChild(heading);

    let next = wrapper.nextSibling;
    while (next && !(next.nodeType === 1 && next.tagName === "H2")) {
      const toMove = next;
      next = next.nextSibling;
      wrapper.appendChild(toMove);
    }

    return wrapper;
  });
}

function buildLinks(container, sections) {
  const itemsHTML = sections
    .filter((section) => section.dataset.tocSkip !== "true")
    .map((section) => {
      const title = section.dataset.tocLabel;
      if (!title) return "";

      return `
        <a href="#${section.id}" class="toc_link w-inline-block">
          <div class="toc_link-text">${title}</div>
        </a>
      `;
    })
    .join("");

  container.innerHTML = `<div class="toc-wrapper_inner">${itemsHTML}</div>`;
}

function insertChevron(heading) {
  if (heading.querySelector(".toc-chevron")) return;
  heading.insertAdjacentHTML("beforeend", CHEVRON_SVG);
}

function bindMobileToggle(toc, heading) {
  heading.setAttribute("role", "button");
  heading.setAttribute("tabindex", "0");
  heading.setAttribute("aria-expanded", "false");

  function toggle() {
    const isOpen = toc.classList.toggle("is-open");
    heading.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  heading.addEventListener("click", toggle);
  heading.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
}

function bindResizeReset(toc, heading) {
  let wasDesktop = window.innerWidth >= DESKTOP_MIN;
  let resizeTimer;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const isDesktop = window.innerWidth >= DESKTOP_MIN;
      if (isDesktop !== wasDesktop) {
        toc.classList.remove("is-open");
        heading.setAttribute("aria-expanded", "false");
        wasDesktop = isDesktop;
      }
    }, 150);
  });
}

function closeTocInstant(toc, heading) {
  toc.classList.add("no-transition");
  toc.classList.remove("is-open");
  heading.setAttribute("aria-expanded", "false");
  void toc.offsetHeight;
  toc.classList.remove("no-transition");
}

function bindClickScroll(container, toc, heading) {
  container.querySelectorAll(".toc_link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      closeTocInstant(toc, heading);

      const offset = getNavOffset();
      const rawTop = target.getBoundingClientRect().top + window.scrollY;
      const targetY = rawTop - offset;

      const lenis = getLenis();

      if (lenis) {
        lenis.scrollTo(targetY, { duration: 1 });
      } else {
        window.scrollTo({ top: targetY, behavior: "smooth" });
      }

      history.pushState(null, "", `#${id}`);
    });
  });
}

function bindActiveHighlight(links, sections) {
  const observedSections = sections.filter((s) => s.dataset.tocSkip !== "true");

  const linkByHref = new Map();
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("#")) {
      linkByHref.set(href.slice(1), link);
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const link = linkByHref.get(entry.target.id);
        if (!link) return;
        links.forEach((l) => l.classList.remove("w--current"));
        link.classList.add("w--current");
      });
    },
    {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    },
  );

  observedSections.forEach((section) => observer.observe(section));
}

let hasInitialized = false;

export function init() {
  if (hasInitialized) return;
  hasInitialized = true;

  const root = document.querySelector(".rich-text_blog");
  const container = document.querySelector(".toc-wrapper");
  const toc = document.querySelector(".toc");
  const heading = document.querySelector(".toc-heading");
  if (!root || !container || !toc || !heading) return;

  const sections = wrapSections(root);
  if (!sections.length) return;

  buildLinks(container, sections);
  insertChevron(heading);
  bindMobileToggle(toc, heading);
  bindResizeReset(toc, heading);

  const links = Array.from(container.querySelectorAll(".toc_link"));
  bindClickScroll(container, toc, heading);
  bindActiveHighlight(links, sections);
}