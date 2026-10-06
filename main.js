(() => {
  // src/utils/on-ready.js
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  // src/utils/motion-preference.js
  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // src/core.js
  var lenisInstance = null;
  var ANCHOR_DURATION = 2;
  var HASH_LOAD_DELAY = 400;
  var easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function getAnchorOffset() {
    const nav = document.querySelector(".nav_fixed");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    return -navHeight;
  }
  function scrollToHash(hash, { instant = false } = {}) {
    if (!hash || hash === "#") return false;
    let target = null;
    try {
      target = document.querySelector(hash);
    } catch (e) {
      return false;
    }
    if (!target) return false;
    const offset = getAnchorOffset();
    if (lenisInstance) {
      lenisInstance.scrollTo(target, {
        offset,
        duration: instant ? 0 : ANCHOR_DURATION,
        easing: easeInOutCubic,
        immediate: instant,
        // Lenis ignore scrollTo() quand il est arrêté (scroll bloqué par un menu
        // ou un dropdown ouvert) : force permet quand même de suivre l'ancre.
        force: true
      });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top, behavior: instant ? "auto" : "smooth" });
    }
    return true;
  }
  function initAnchors() {
    document.addEventListener(
      "click",
      (e) => {
        const link = e.target.closest && e.target.closest("a[href*='#']");
        if (!link) return;
        const url = new URL(link.href, window.location.href);
        const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname;
        if (!samePage || !url.hash || url.hash === "#") return;
        if (scrollToHash(url.hash)) {
          e.preventDefault();
          e.stopPropagation();
          history.pushState(null, "", url.hash);
        }
      },
      true
    );
    if (window.location.hash) {
      const hash = window.location.hash;
      window.scrollTo(0, 0);
      const go = () => {
        if (window.scrollY > 50) return;
        scrollToHash(hash);
        setTimeout(
          () => scrollToHash(hash, { instant: true }),
          ANCHOR_DURATION * 1e3 + 100
        );
      };
      const start = () => setTimeout(go, HASH_LOAD_DELAY);
      if (document.readyState === "complete") {
        start();
      } else {
        window.addEventListener("load", start, { once: true });
      }
    }
  }
  function initLenis() {
    if (typeof window.Lenis === "undefined") return null;
    if (prefersReducedMotion()) return null;
    lenisInstance = new window.Lenis({
      duration: 1.2,
      smoothWheel: true,
      anchors: false
    });
    if (typeof window.gsap !== "undefined") {
      if (typeof window.ScrollTrigger !== "undefined") {
        lenisInstance.on("scroll", window.ScrollTrigger.update);
      }
      window.gsap.ticker.add((time) => {
        lenisInstance.raf(time * 1e3);
      });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      let raf = function(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }
    window.addEventListener("load", () => {
      lenisInstance.resize();
      if (typeof window.ScrollTrigger !== "undefined") {
        window.ScrollTrigger.refresh();
      }
    });
    if (typeof ResizeObserver !== "undefined") {
      const resizeObserver = new ResizeObserver(() => {
        lenisInstance.resize();
        if (typeof window.ScrollTrigger !== "undefined") {
          window.ScrollTrigger.refresh();
        }
      });
      resizeObserver.observe(document.body);
    }
    return lenisInstance;
  }
  function getLenis() {
    return lenisInstance;
  }
  function init() {
    initLenis();
    initAnchors();
  }

  // src/collapse.js
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

  // src/tag-reveal.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  var DEFAULT_STAGGER = 0.12;
  var MAX_DELAY = 3;
  function createFadeGradient(svg, color) {
    const gradientId = `tag-trace-${Math.random().toString(36).slice(2, 9)}`;
    const gradient = document.createElementNS(SVG_NS, "linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    [
      { offset: "0", opacity: "0" },
      { offset: "0.55", opacity: "0.5" },
      { offset: "0.85", opacity: "1" },
      { offset: "1", opacity: "0" }
    ].forEach(({ offset, opacity }) => {
      const stop = document.createElementNS(SVG_NS, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      stop.setAttribute("stop-opacity", opacity);
      gradient.appendChild(stop);
    });
    const defs = document.createElementNS(SVG_NS, "defs");
    defs.appendChild(gradient);
    svg.appendChild(defs);
    return { gradient };
  }
  function buildTraceSvg(tag) {
    const width = tag.offsetWidth;
    const height = tag.offsetHeight;
    if (!width || !height) return null;
    const computed = getComputedStyle(tag);
    const radius = Math.min(parseFloat(computed.borderRadius) || 0, height / 2);
    const strokeWidth = parseFloat(tag.dataset.tagTraceWidth) || 1;
    const inset = strokeWidth / 2;
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.style.position = "absolute";
    svg.style.pointerEvents = "none";
    svg.style.overflow = "visible";
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", inset);
    rect.setAttribute("y", inset);
    rect.setAttribute("width", width - strokeWidth);
    rect.setAttribute("height", height - strokeWidth);
    rect.setAttribute("rx", Math.max(radius - inset, 0));
    rect.setAttribute("ry", Math.max(radius - inset, 0));
    rect.setAttribute("fill", "none");
    rect.setAttribute("stroke-width", strokeWidth);
    svg.appendChild(rect);
    return { svg, rect };
  }
  function animateTag(tag, delay = 0) {
    if (typeof window.gsap === "undefined") return;
    if (tag.dataset.tagTraced) return;
    const built = buildTraceSvg(tag);
    if (!built) return;
    tag.dataset.tagTraced = "1";
    const { svg, rect } = built;
    if (getComputedStyle(tag).position === "static") {
      tag.style.position = "relative";
    }
    const borderWidth = parseFloat(getComputedStyle(tag).borderWidth) || 0;
    svg.style.inset = `-${borderWidth}px`;
    tag.appendChild(svg);
    const totalLength = rect.getTotalLength();
    const segmentLength = parseFloat(tag.dataset.tagTraceLength) || totalLength * 0.22;
    const travelRatio = Math.min(Math.max(parseFloat(tag.dataset.tagTraceTravel) || 0.5, 0.1), 1);
    const travelDuration = parseFloat(tag.dataset.tagTraceDuration) || 0.35;
    const endDuration = parseFloat(tag.dataset.tagTraceEndDuration) || 0.15;
    const color = tag.dataset.tagTraceColor || "#1A1A1A";
    const baseWidth = parseFloat(tag.dataset.tagTraceWidth) || 1;
    const headEnd = Math.max(totalLength * travelRatio, segmentLength + 1);
    const growDuration = Math.min(travelDuration * 0.25, 0.12);
    const { gradient } = createFadeGradient(svg, color);
    rect.style.stroke = `url(#${gradient.id})`;
    function setIntensity(i) {
      rect.style.strokeOpacity = i;
      rect.setAttribute("stroke-width", baseWidth * (0.7 + 0.8 * i));
    }
    function setSegment(start, length) {
      rect.style.strokeDasharray = `${length} ${totalLength - length}`;
      rect.style.strokeDashoffset = `${-start}`;
    }
    function updateGradient(start, length) {
      const p1 = rect.getPointAtLength((start % totalLength + totalLength) % totalLength);
      const p2 = rect.getPointAtLength(((start + length) % totalLength + totalLength) % totalLength);
      gradient.setAttribute("x1", p1.x);
      gradient.setAttribute("y1", p1.y);
      gradient.setAttribute("x2", p2.x);
      gradient.setAttribute("y2", p2.y);
    }
    setSegment(0, 0);
    setIntensity(0);
    let currentLength = 0;
    const tl = window.gsap.timeline({ delay });
    const growProxy = { len: 0 };
    tl.to(growProxy, {
      len: segmentLength,
      duration: growDuration,
      ease: "power1.in",
      onUpdate: () => {
        currentLength = growProxy.len;
        setSegment(0, currentLength);
        updateGradient(0, currentLength);
      }
    });
    const travelProxy = { pos: segmentLength };
    tl.to(travelProxy, {
      pos: headEnd,
      duration: travelDuration,
      ease: "power1.inOut",
      onUpdate: () => {
        const start = travelProxy.pos - currentLength;
        setSegment(start, currentLength);
        updateGradient(start, currentLength);
      }
    });
    const shrinkProxy = { len: segmentLength };
    tl.to(shrinkProxy, {
      len: 0,
      duration: endDuration,
      ease: "power2.in",
      onUpdate: () => {
        currentLength = shrinkProxy.len;
        const start = headEnd - currentLength;
        setSegment(start, currentLength);
        updateGradient(start, currentLength);
      }
    });
    const peakTime = growDuration + travelDuration * 0.45;
    const fx = { i: 0 };
    tl.to(fx, { i: 1, duration: peakTime, ease: "sine.out", onUpdate: () => setIntensity(fx.i) }, 0);
    tl.to(
      fx,
      {
        i: 0,
        duration: growDuration + travelDuration + endDuration - peakTime,
        ease: "sine.in",
        onUpdate: () => setIntensity(fx.i)
      },
      peakTime
    );
    tl.call(() => svg.remove());
  }
  function initTagReveal(root = document) {
    if (typeof window.gsap === "undefined") return;
    const observed = /* @__PURE__ */ new WeakSet();
    let queueIndex = 0;
    let resetTimer = null;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => {
          const ra = a.target.getBoundingClientRect();
          const rb = b.target.getBoundingClientRect();
          return ra.top - rb.top || ra.left - rb.left;
        });
        visible.forEach((entry) => {
          const tag = entry.target;
          observer.unobserve(tag);
          const stagger = parseFloat(tag.dataset.tagTraceStagger) || DEFAULT_STAGGER;
          const delay = Math.min(queueIndex * stagger, MAX_DELAY);
          queueIndex += 1;
          animateTag(tag, delay);
          if (!tag.dataset.tagTraced) observed.delete(tag);
        });
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          queueIndex = 0;
        }, 300);
      },
      { threshold: 0.1 }
    );
    function observeAll(scope) {
      scope.querySelectorAll(".tag-animated").forEach((tag) => {
        if (observed.has(tag) || tag.dataset.tagTraced) return;
        observed.add(tag);
        observer.observe(tag);
      });
    }
    observeAll(root);
    new MutationObserver(() => observeAll(document)).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // src/blog-accordion.js
  function initBlogAccordion() {
    const accordions = document.querySelectorAll(".accordion1_component");
    if (!accordions.length) return;
    accordions.forEach((accordion) => {
      const top = accordion.querySelector(".accordion1_top");
      const bottom = accordion.querySelector(".accordion1_bottom");
      const icon = accordion.querySelector(".accordion1_icon");
      if (!top || !bottom) return;
      bottom.style.height = "0px";
      top.addEventListener("click", () => {
        if (bottom.style.height !== "0px") {
          bottom.style.height = "0px";
          if (icon) icon.style.transform = "rotateZ(0deg)";
        } else {
          bottom.style.height = bottom.scrollHeight + "px";
          if (icon) icon.style.transform = "rotateZ(180deg)";
        }
      });
    });
  }

  // src/share-toast.js
  function showToast(message) {
    let toast = document.querySelector(".toast-copy");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast-copy";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    void toast.offsetWidth;
    toast.classList.add("is-visible");
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
  }
  function getPageUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const url = canonical ? canonical.href : window.location.href;
    return url.split("#")[0];
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      ok ? resolve() : reject();
    });
  }
  function initShareToast() {
    document.querySelectorAll(".link-page").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        copyText(getPageUrl()).then(() => showToast("Lien bien copi\xE9")).catch(() => showToast("Impossible de copier le lien"));
      });
    });
    document.querySelectorAll(".link-page-linkedin").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const share = "https://www.linkedin.com/feed/?shareActive=true&shareUrl=" + encodeURIComponent(getPageUrl());
        window.open(share, "_blank", "noopener,noreferrer");
      });
    });
  }

  // src/blog-toc.js
  var NAV_OFFSET_DESKTOP = 164;
  var NAV_OFFSET_MOBILE = 164;
  var TOC_LABEL_REGEX = /\s*\[toc:([^\]]+)\]\s*$/i;
  var TOC_SKIP_VALUE = "-";
  var DESKTOP_MIN = 992;
  var CHEVRON_SVG = '<svg class="toc-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function getNavOffset() {
    return window.innerWidth < DESKTOP_MIN ? NAV_OFFSET_MOBILE : NAV_OFFSET_DESKTOP;
  }
  function slugify(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
    const itemsHTML = sections.filter((section) => section.dataset.tocSkip !== "true").map((section) => {
      const title = section.dataset.tocLabel;
      if (!title) return "";
      return `
        <a href="#${section.id}" class="toc_link w-inline-block">
          <div class="toc_link-text">${title}</div>
        </a>
      `;
    }).join("");
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
    const linkByHref = /* @__PURE__ */ new Map();
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
        threshold: 0
      }
    );
    observedSections.forEach((section) => observer.observe(section));
  }
  var hasInitialized = false;
  function init2() {
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

  // src/embeds/table-enhance.js
  var TABLE_BLOCK_REGEX = /(?:<p>)?\[table(\s+split)?\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/table\](?:<\/p>)?/gi;
  function cleanRow(line) {
    return line.split(",").map((cell) => cell.trim());
  }
  function transformTable(html) {
    return html.replace(TABLE_BLOCK_REGEX, (match, splitFlag, body) => {
      const useSplit = Boolean(splitFlag);
      const rows = body.replace(/<\/p>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n").map((line) => line.trim()).filter(Boolean).map(cleanRow);
      if (!rows.length) return match;
      const [headerRow, ...bodyRows] = rows;
      const theadHTML = `<tr>${headerRow.map((cell) => `<th scope="col">${cell}</th>`).join("")}</tr>`;
      const tbodyHTML = bodyRows.map((row) => {
        if (!useSplit) {
          return `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
        }
        const [rowHeader, ...rest] = row;
        const cellsHTML = rest.map((cell) => `<td>${cell}</td>`).join("");
        return `<tr><th scope="row">${rowHeader}</th>${cellsHTML}</tr>`;
      }).join("");
      return `
      <div class="rt-table-wrap blog-embed_wrapper">
        <table class="rt-table${useSplit ? " rt-table--split" : ""}">
          <thead>${theadHTML}</thead>
          <tbody>${tbodyHTML}</tbody>
        </table>
      </div>
    `;
    });
  }

  // src/embeds/list-enhance.js
  var LIST_BLOCK_REGEX = /(?:<p>)?\[list\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/list\](?:<\/p>)?/gi;
  var BOLD_REGEX = /\[b\](.*?)\[\/b\]/gi;
  function applyBold(text) {
    return text.replace(BOLD_REGEX, '<strong class="rt-bold">$1</strong>');
  }
  function transformList(html) {
    return html.replace(LIST_BLOCK_REGEX, (match, body) => {
      const items = body.replace(/<\/p>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
      if (!items.length) return match;
      const itemsHTML = items.map(
        (item) => `
          <li class="rt-list-item">
            <span class="rt-list-bullet" aria-hidden="true"></span>
            <span class="rt-list-content">${applyBold(item)}</span>
          </li>
        `
      ).join("");
      return `<div class="blog-embed_wrapper"><ul class="rt-list rt-text" role="list">${itemsHTML}</ul></div>`;
    });
  }

  // src/embeds/calc-enhance.js
  var CALC_BLOCK_REGEX = /(?:<p>)?\[calc\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/calc\](?:<\/p>)?/gi;
  function transformCalc(html) {
    return html.replace(CALC_BLOCK_REGEX, (match, body) => {
      const lines = body.replace(/<\/p>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
      if (!lines.length) return match;
      const blocks = [];
      const noteLines = [];
      let currentBlock = null;
      let afterSeparator = false;
      lines.forEach((line) => {
        if (/^title:/i.test(line)) {
          currentBlock = { title: line.replace(/^title:/i, "").trim(), lines: [] };
          blocks.push(currentBlock);
          return;
        }
        if (/^-{3,}$/.test(line)) {
          afterSeparator = true;
          return;
        }
        if (afterSeparator) {
          noteLines.push(line);
          return;
        }
        if (currentBlock) {
          currentBlock.lines.push(line);
        }
      });
      const blocksHTML = blocks.map(
        (block) => `
          <div class="rt-calc-block">
            <h4 class="rt-calc-title">${block.title}</h4>
            ${block.lines.map((l) => `<p class="rt-calc-line">${l}</p>`).join("")}
          </div>
        `
      ).join("");
      const footerHTML = noteLines.length ? `
        <div class="rt-calc-footer">
          <p class="rt-calc-note">${noteLines.join(" ")}</p>
        </div>
      ` : "";
      return `
      <div class="blog-embed_wrapper">
        <div class="rt-calc">
          ${blocksHTML}
          ${footerHTML}
        </div>
      </div>
    `;
    });
  }

  // src/utils/parse-attrs.js
  var ATTR_REGEX = /(\w+)="([^"]*)"/g;
  function parseAttrs(attrString = "") {
    const attrs = {};
    let match;
    ATTR_REGEX.lastIndex = 0;
    while ((match = ATTR_REGEX.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }

  // src/embeds/button-enhance.js
  var BUTTON_BLOCK_REGEX = /(?:<p>)?\[button([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/button\](?:<\/p>)?/gi;
  function buildIconSVG(idSuffix) {
    const raw = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-1.69982" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_0_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="2.07751" cy="2.08166" r="1.31507" transform="rotate(-180 2.07751 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="-0.110111" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_1_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="2.08166" r="1.31507" transform="rotate(-180 8.00524 2.08166)" fill="white"/>
<foreignObject x="10.142" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_2_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="13.9193" cy="2.08166" r="1.31507" transform="rotate(-180 13.9193 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="-0.114994" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_3_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="2.07751" cy="7.99841" r="1.31507" transform="rotate(-180 2.07751 7.99841)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_4_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="7.99841" r="1.31507" transform="rotate(-180 8.00524 7.99841)" fill="white"/>
<foreignObject x="11.7268" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_5_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="13.9193" cy="7.99841" r="1.31507" transform="rotate(-180 13.9193 7.99841)" fill="white"/>
<foreignObject x="-1.69982" y="10.1408" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_6_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="2.07751" cy="13.9174" r="1.31507" transform="rotate(-180 2.07751 13.9174)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="11.7256" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_7_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="13.9174" r="1.31507" transform="rotate(-180 8.00524 13.9174)" fill="white"/>
<foreignObject x="10.142" y="10.1408" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_8_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="13.9193" cy="13.9174" r="1.31507" transform="rotate(-180 13.9193 13.9174)" fill="white" fill-opacity="0.1"/>
<defs>
<clipPath id="bgblur_0_27936_9718_clip_path" transform="translate(1.69982 1.69494)"><circle cx="2.07751" cy="2.08166" r="1.31507" transform="rotate(-180 2.07751 2.08166)"/>
</clipPath><clipPath id="bgblur_1_27936_9718_clip_path" transform="translate(-5.81274 0.110111)"><circle cx="8.00524" cy="2.08166" r="1.31507" transform="rotate(-180 8.00524 2.08166)"/>
</clipPath><clipPath id="bgblur_2_27936_9718_clip_path" transform="translate(-10.142 1.69494)"><circle cx="13.9193" cy="2.08166" r="1.31507" transform="rotate(-180 13.9193 2.08166)"/>
</clipPath><clipPath id="bgblur_3_27936_9718_clip_path" transform="translate(0.114994 -5.80664)"><circle cx="2.07751" cy="7.99841" r="1.31507" transform="rotate(-180 2.07751 7.99841)"/>
</clipPath><clipPath id="bgblur_4_27936_9718_clip_path" transform="translate(-5.81274 -5.80664)"><circle cx="8.00524" cy="7.99841" r="1.31507" transform="rotate(-180 8.00524 7.99841)"/>
</clipPath><clipPath id="bgblur_5_27936_9718_clip_path" transform="translate(-11.7268 -5.80664)"><circle cx="13.9193" cy="7.99841" r="1.31507" transform="rotate(-180 13.9193 7.99841)"/>
</clipPath><clipPath id="bgblur_6_27936_9718_clip_path" transform="translate(1.69982 -10.1408)"><circle cx="2.07751" cy="13.9174" r="1.31507" transform="rotate(-180 2.07751 13.9174)"/>
</clipPath><clipPath id="bgblur_7_27936_9718_clip_path" transform="translate(-5.81274 -11.7256)"><circle cx="8.00524" cy="13.9174" r="1.31507" transform="rotate(-180 8.00524 13.9174)"/>
</clipPath><clipPath id="bgblur_8_27936_9718_clip_path" transform="translate(-10.142 -10.1408)"><circle cx="13.9193" cy="13.9174" r="1.31507" transform="rotate(-180 13.9193 13.9174)"/>
</clipPath></defs>
</svg>`;
    return raw.split("27936_9718").join(idSuffix).split('fill="white"').join('fill="currentColor"');
  }
  var buttonInstanceCounter = 0;
  function transformButton(html) {
    return html.replace(BUTTON_BLOCK_REGEX, (match, attrString, body) => {
      const attrs = parseAttrs(attrString);
      const href = attrs.href || "#";
      const label = body.replace(/<[^>]+>/g, "").trim();
      if (!label) return match;
      const showIcon = attrs.icon !== "false";
      buttonInstanceCounter += 1;
      const iconHTML = showIcon ? `<div class="rt-button-icon">${buildIconSVG(`rtbtn${buttonInstanceCounter}`)}</div>` : "";
      return `<div class="blog-embed_wrapper"><a href="${href}" class="rt-button">${iconHTML}<div>${label}</div></a></div>`;
    });
  }

  // src/embeds/quote-enhance.js
  var QUOTE_BLOCK_REGEX = /(?:<p>)?\[quote(?=[\s\]])([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote\](?:<\/p>)?/gi;
  function transformQuote(html) {
    return html.replace(QUOTE_BLOCK_REGEX, (match, attrString, body) => {
      const attrs = parseAttrs(attrString);
      const text = body.replace(/<\/p>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
      if (!text) return match;
      const name = attrs.name || "";
      const role = attrs.role || "";
      const img = attrs.img || "";
      const authorHTML = name || img ? `
          <div class="rt-quote-author">
            ${img ? `<img src="${img}" alt="${name}" class="rt-quote-avatar">` : ""}
            <div class="rt-quote-author-info">
              ${name ? `<p class="rt-quote-name">${name}</p>` : ""}
              ${role ? `<p class="rt-quote-role">${role}</p>` : ""}
            </div>
          </div>
        ` : "";
      return `
      <div class="blog-embed_wrapper">
        <div class="rt-quote">
          <p class="rt-quote-text">&ldquo;${text}&rdquo;</p>
          ${authorHTML}
        </div>
      </div>
    `;
    });
  }

  // src/embeds/quote-large-enhance.js
  var QUOTE_LARGE_BLOCK_REGEX = /(?:<p>)?\[quote-large\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote-large\](?:<\/p>)?/gi;
  function transformQuoteLarge(html) {
    return html.replace(QUOTE_LARGE_BLOCK_REGEX, (match, body) => {
      const text = body.replace(/<\/p>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
      if (!text) return match;
      return `
      <div class="blog-embed_wrapper">
        <blockquote class="rt-quote-large" data-text-reveal data-anim-stagger="0.06">&ldquo;${text}&rdquo;</blockquote>
      </div>
    `;
    });
  }

  // src/embeds/slider-enhance.js
  var SLIDER_BLOCK_REGEX = /(?:<p>)?\[slider\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/slider\](?:<\/p>)?/gi;
  var CHEVRON_SVG2 = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M6.00003 4L10 8L6 12" stroke="#1A1A1A" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildSlidesHTML(body) {
    const lines = body.replace(/<\/p>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
    const total = lines.length;
    return lines.map((line, idx) => {
      const parts = line.split("|").map((s) => s.trim());
      const url = parts[0];
      const caption = parts[1] || "";
      if (!url) return "";
      const captionHTML = caption ? `<figcaption class="rt-slider-caption">${caption}</figcaption>` : "";
      return `
        <div class="rt-slider-item" role="group" aria-roledescription="diapositive" aria-label="${idx + 1} sur ${total}">
          <img src="${url}" alt="${caption}" loading="lazy" draggable="false">
          ${captionHTML}
        </div>
      `;
    }).join("");
  }
  function transformSlider(html) {
    return html.replace(SLIDER_BLOCK_REGEX, (match, body) => {
      const slidesHTML = buildSlidesHTML(body);
      if (!slidesHTML) return match;
      return `
      <div class="rt-slider" role="region" aria-roledescription="carrousel" aria-label="Galerie d'images" tabindex="0">
        <div class="rt-slider-track">${slidesHTML}</div>
        <div class="rt-slider-controls">
          <button type="button" class="rt-slider-prev" aria-label="Image pr\xE9c\xE9dente">${CHEVRON_SVG2}</button>
          <button type="button" class="rt-slider-next" aria-label="Image suivante">${CHEVRON_SVG2}</button>
        </div>
      </div>
    `;
    });
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
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToIndex(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToIndex(index + 1);
      }
    });
    track.addEventListener("pointerdown", (e) => {
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
      var _a;
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove("is-dragging");
      const finalX = (_a = e.clientX) != null ? _a : lastX;
      const deltaX = finalX - startX;
      const threshold = Math.min(el.clientWidth * SWIPE_THRESHOLD_RATIO, 100);
      const isFlick = Math.abs(velocity) > FLICK_VELOCITY;
      if (Math.abs(deltaX) > threshold || isFlick) {
        const direction = deltaX > 0 || isFlick && velocity > 0 ? -1 : 1;
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
  function initSliderListeners(root = document) {
    root.querySelectorAll(".rt-slider:not([data-slider-initialized])").forEach((el) => {
      el.setAttribute("data-slider-initialized", "true");
      initOneSlider(el);
    });
  }

  // src/embeds/video-enhance.js
  var VIDEO_BLOCK_REGEX = /(?:<p>)?\[video([^\]]*)\](?:<\/p>)?/gi;
  var PLYR_I18N_FR = {
    play: "Lire",
    pause: "Pause",
    mute: "Couper le son",
    unmute: "Activer le son",
    enableCaptions: "Activer les sous-titres",
    disableCaptions: "D\xE9sactiver les sous-titres",
    enterFullscreen: "Plein \xE9cran",
    exitFullscreen: "Quitter le plein \xE9cran"
  };
  function getVideoInfo(src) {
    const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) return { type: "youtube", id: ytMatch[1] };
    const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: "vimeo", id: vimeoMatch[1] };
    return { type: "native", id: null };
  }
  function buildPlayerMarkup(src, poster, captions, title) {
    const info = getVideoInfo(src);
    const frameTitle = title || "Lecteur vid\xE9o";
    if (info.type === "youtube") {
      return `<div class="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${info.id}" title="${frameTitle}"></div>`;
    }
    if (info.type === "vimeo") {
      return `<div class="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id="${info.id}" title="${frameTitle}"></div>`;
    }
    const posterAttr = poster ? ` poster="${poster}"` : "";
    const trackHTML = captions ? `<track kind="captions" label="Fran\xE7ais" srclang="fr" src="${captions}" default>` : "";
    return `<video playsinline preload="metadata"${posterAttr}><source src="${src}" type="video/mp4">${trackHTML}</video>`;
  }
  function buildGlassIconSVG(idSuffix) {
    const raw = `<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-48" y="-48" width="144" height="144"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(24px);clip-path:url(#bgblur_0_102_1211_clip_path);height:100%;width:100%"></div></foreignObject><g data-figma-bg-blur-radius="48">
<rect width="48" height="48" rx="24" fill="white" fill-opacity="0.2"></rect>
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 19.8599C19.5 18.9472 20.5008 18.388 21.2781 18.8663L28.0061 23.0066C28.7464 23.4622 28.7464 24.5382 28.0061 24.9938L21.2781 29.1341C20.5008 29.6124 19.5 29.0532 19.5 28.1405V19.8599Z" fill="white"></path>
</g>
<defs>
<clipPath id="bgblur_0_102_1211_clip_path" transform="translate(48 48)"><rect width="48" height="48" rx="24"></rect>
</clipPath></defs>
</svg>`;
    return raw.split("102_1211").join(idSuffix);
  }
  function formatDuration(seconds) {
    if (!seconds || !isFinite(seconds)) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }
  var videoInstanceCounter = 0;
  function transformVideo(html) {
    return html.replace(VIDEO_BLOCK_REGEX, (match, attrString) => {
      const attrs = parseAttrs(attrString);
      const src = attrs.src || "";
      const poster = attrs.poster || "";
      const captions = attrs.captions || "";
      const title = attrs.title || "";
      if (!src) return match;
      videoInstanceCounter += 1;
      const iconSVG = buildGlassIconSVG(`rtvid${videoInstanceCounter}`);
      return `
      <div class="rt-video">
        <div class="rt-video-player">${buildPlayerMarkup(src, poster, captions, title)}</div>
        <div class="rt-video-overlay">
          <div class="rt-video-gradient"></div>
          <div class="rt-video-cta">
            <button type="button" class="rt-video-play-glass" aria-label="Voir la vid\xE9o">${iconSVG}</button>
            <div class="rt-video-cta-meta">
              <span class="rt-video-cta-text">Voir la vid\xE9o</span>
              <span class="rt-video-cta-duration"></span>
            </div>
          </div>
        </div>
      </div>
    `;
    });
  }
  function initVideoListeners(root = document) {
    root.querySelectorAll(".rt-video:not([data-video-initialized])").forEach((el) => {
      var _a;
      el.setAttribute("data-video-initialized", "true");
      if (typeof window.Plyr === "undefined") return;
      const target = (_a = el.querySelector(".rt-video-player")) == null ? void 0 : _a.firstElementChild;
      if (!target) return;
      const hasCaptions = Boolean(el.querySelector("track"));
      const controls = [
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        ...hasCaptions ? ["captions"] : [],
        "fullscreen"
      ];
      const player = new window.Plyr(target, {
        controls,
        i18n: PLYR_I18N_FR
      });
      const glassBtn = el.querySelector(".rt-video-play-glass");
      const durationEl = el.querySelector(".rt-video-cta-duration");
      if (glassBtn) {
        glassBtn.addEventListener("click", () => player.play());
      }
      player.on("play", () => el.classList.add("is-playing"));
      player.on("pause", () => el.classList.remove("is-playing"));
      player.on("loadedmetadata", () => {
        const formatted = formatDuration(player.duration);
        if (formatted && durationEl) durationEl.textContent = formatted;
      });
    });
  }

  // src/embeds/index.js
  function initEmbeds(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    let html = contentEl.innerHTML;
    html = transformTable(html);
    html = transformList(html);
    html = transformCalc(html);
    html = transformButton(html);
    html = transformQuote(html);
    html = transformQuoteLarge(html);
    html = transformSlider(html);
    html = transformVideo(html);
    contentEl.innerHTML = html;
    initSliderListeners(contentEl);
    initVideoListeners(contentEl);
  }

  // src/blog-faq.js
  function initBlogFaq(root = document) {
    const faqItems = root.querySelectorAll(".faq_item");
    if (!faqItems.length) return;
    faqItems.forEach((item, index) => {
      const trigger = item.querySelector(".faq_question-wrapper");
      const content = item.querySelector(".overflow-hidden");
      if (!trigger || !content) return;
      const contentId = `faq-answer-${index + 1}`;
      const triggerId = `faq-question-${index + 1}`;
      content.id = contentId;
      content.setAttribute("role", "region");
      content.setAttribute("aria-labelledby", triggerId);
      trigger.id = triggerId;
      trigger.setAttribute("role", "button");
      trigger.setAttribute("tabindex", "0");
      trigger.setAttribute("aria-controls", contentId);
      trigger.setAttribute("aria-expanded", "false");
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger.click();
        }
      });
      const observer = new MutationObserver(() => {
        const isOpen = content.style.height !== "0px" && content.style.height !== "";
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
      observer.observe(content, {
        attributes: true,
        attributeFilter: ["style"]
      });
    });
  }

  // src/schema/utils.js
  function pathnameStartsWith(prefix) {
    return window.location.pathname.startsWith(prefix);
  }
  var FR_MONTHS = {
    janvier: "01",
    f\u00E9vrier: "02",
    fevrier: "02",
    mars: "03",
    avril: "04",
    mai: "05",
    juin: "06",
    juillet: "07",
    ao\u00FBt: "08",
    aout: "08",
    septembre: "09",
    octobre: "10",
    novembre: "11",
    d\u00E9cembre: "12",
    decembre: "12"
  };
  function parseFrDate(text) {
    const match = (text || "").trim().toLowerCase().match(/^(\d{1,2})\s+([a-zéû]+)\s+(\d{4})$/i);
    if (!match) return null;
    const [, day, monthName, year] = match;
    const month = FR_MONTHS[monthName];
    if (!month) return null;
    return `${year}-${month}-${day.padStart(2, "0")}`;
  }
  function getIsoDate(root, selector) {
    const el = root.querySelector(selector);
    return (el == null ? void 0 : el.getAttribute("datetime")) || null;
  }
  function getFaqEntities(root, scopeSelector, questionSelector = ".faq_question", answerSelector = ".rich-text-faq") {
    const scope = scopeSelector ? root.querySelector(scopeSelector) : root;
    if (!scope) return [];
    return Array.from(scope.querySelectorAll(".faq_item")).map((item) => {
      var _a, _b, _c, _d;
      const question = (_b = (_a = item.querySelector(questionSelector)) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
      const answer = (_d = (_c = item.querySelector(answerSelector)) == null ? void 0 : _c.textContent) == null ? void 0 : _d.trim();
      if (!question || !answer) return null;
      return {
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer }
      };
    }).filter(Boolean);
  }
  function injectGraph(graph) {
    var _a;
    (_a = document.getElementById("schema-dynamic")) == null ? void 0 : _a.remove();
    if (!graph.length) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "schema-dynamic";
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
    document.head.appendChild(script);
  }

  // src/schema/builders.js
  var ORG_REF = {
    "@type": "Organization",
    name: "RockFi",
    url: "https://www.rockfi.com"
  };
  function buildArticleSchema(root) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const headline = (_b = (_a = root.querySelector(".heading-blog")) == null ? void 0 : _a.textContent) == null ? void 0 : _b.trim();
    if (!headline) return [];
    const image = (_c = root.querySelector(".large_img_blog img")) == null ? void 0 : _c.src;
    const description = (_d = root.querySelector('meta[name="description"]')) == null ? void 0 : _d.getAttribute("content");
    const authorName = (_f = (_e = root.querySelector(".profil-left")) == null ? void 0 : _e.textContent) == null ? void 0 : _f.replace(/^\s*par\s*/i, "").trim();
    const datePublished = getIsoDate(root, ".seo-date-source") || parseFrDate(
      (_h = (_g = root.querySelector(".content_sidebar_date")) == null ? void 0 : _g.lastElementChild) == null ? void 0 : _h.textContent
    );
    const cleanUrl = window.location.origin + window.location.pathname;
    const post = {
      "@type": "BlogPosting",
      headline,
      url: cleanUrl,
      mainEntityOfPage: cleanUrl
    };
    if (image) post.image = image;
    if (datePublished) post.datePublished = datePublished;
    if (description) post.description = description;
    if (authorName) post.author = { "@type": "Person", name: authorName };
    post.publisher = ORG_REF;
    const entities = [post];
    const faqEntities = getFaqEntities(root, ".faq_content-blog");
    if (faqEntities.length) {
      entities.push({ "@type": "FAQPage", mainEntity: faqEntities });
    }
    return entities;
  }

  // src/schema/registry.js
  var PAGE_BUILDERS = [
    {
      test: () => pathnameStartsWith("/blog-post/") || pathnameStartsWith("/landing-posts/"),
      build: buildArticleSchema
    }
  ];

  // src/schema/index.js
  function initSchema(root = document) {
    var _a, _b;
    const graph = (_b = (_a = PAGE_BUILDERS.find((entry) => entry.test(root))) == null ? void 0 : _a.build(root)) != null ? _b : [];
    injectGraph(graph);
  }

  // src/animate/setup.js
  var isSetup = false;
  function setupGsap() {
    if (isSetup) return;
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    isSetup = true;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const lenis = getLenis();
    if (lenis) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => {
        lenis.raf(time * 1e3);
      });
      window.gsap.ticker.lagSmoothing(0);
    }
  }

  // src/animate/split-text.js
  var MASK_PADDING = "0.3em";
  function tokenize(el) {
    const tokens = [];
    const pushText = (text) => {
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) tokens.push({ type: "space" });
        else tokens.push({ type: "word", text: part });
      });
    };
    const walk = (node) => {
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          pushText(child.textContent);
        } else if (child.nodeName === "BR") {
          tokens.push({ type: "br" });
        } else {
          walk(child);
        }
      });
    };
    walk(el);
    return tokens;
  }
  function splitWordsMasked(el) {
    const tokens = tokenize(el);
    el.innerHTML = "";
    const innerEls = [];
    tokens.forEach((token) => {
      if (token.type === "br") {
        el.appendChild(document.createElement("br"));
        return;
      }
      if (token.type === "space") {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      const mask = document.createElement("span");
      mask.className = "split-word-mask";
      mask.style.display = "inline-block";
      mask.style.overflow = "hidden";
      mask.style.verticalAlign = "top";
      mask.style.padding = MASK_PADDING;
      mask.style.margin = `-${MASK_PADDING}`;
      const inner = document.createElement("span");
      inner.className = "split-word-inner";
      inner.style.display = "inline-block";
      inner.textContent = token.text;
      mask.appendChild(inner);
      el.appendChild(mask);
      innerEls.push(inner);
    });
    return innerEls;
  }
  function getHiddenOffsets(innerEls) {
    return innerEls.map((inner) => {
      const mask = inner.parentElement;
      return mask.offsetHeight;
    });
  }
  function splitWords(el) {
    const tokens = tokenize(el);
    el.innerHTML = "";
    const wordEls = [];
    tokens.forEach((token) => {
      if (token.type === "br") {
        el.appendChild(document.createElement("br"));
        return;
      }
      if (token.type === "space") {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.className = "split-word";
      span.style.display = "inline-block";
      span.textContent = token.text;
      el.appendChild(span);
      wordEls.push(span);
    });
    return wordEls;
  }

  // src/animate/presets.js
  var PRESETS = {
    "fade-up": (el, opts) => {
      var _a, _b, _c, _d;
      window.gsap.set(el, { opacity: 0, y: (_a = opts.distance) != null ? _a : 32 });
      return window.gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: (_b = opts.duration) != null ? _b : 0.8,
        delay: (_c = opts.delay) != null ? _c : 0,
        ease: (_d = opts.ease) != null ? _d : "power2.out"
      });
    },
    "fade-in": (el, opts) => {
      var _a, _b, _c;
      window.gsap.set(el, { opacity: 0 });
      return window.gsap.to(el, {
        opacity: 1,
        duration: (_a = opts.duration) != null ? _a : 0.8,
        delay: (_b = opts.delay) != null ? _b : 0,
        ease: (_c = opts.ease) != null ? _c : "power1.out"
      });
    },
    "scale-in": (el, opts) => {
      var _a, _b, _c, _d;
      window.gsap.set(el, { opacity: 0, scale: (_a = opts.scale) != null ? _a : 0.92 });
      return window.gsap.to(el, {
        opacity: 1,
        scale: 1,
        duration: (_b = opts.duration) != null ? _b : 0.8,
        delay: (_c = opts.delay) != null ? _c : 0,
        ease: (_d = opts.ease) != null ? _d : "power2.out"
      });
    },
    // Reveal d'image façon "rideau" simple (scale + fondu) : l'élément doit
    // avoir un wrapper avec overflow:hidden côté CSS (ex: .image_blog).
    "image-reveal": (el, opts) => {
      var _a, _b, _c, _d;
      const distance = `${(_a = opts.distance) != null ? _a : 1.5}rem`;
      window.gsap.set(el, { y: distance });
      return window.gsap.to(el, {
        y: 0,
        duration: (_b = opts.duration) != null ? _b : 2,
        delay: (_c = opts.delay) != null ? _c : 0,
        ease: (_d = opts.ease) != null ? _d : "power3.out"
      });
    },
    // Anime un nombre de 0 jusqu'à sa valeur finale, avec un pas d'incrément qui
    // s'adapte à la magnitude du nombre — un grand nombre (ex: 1500) compte par
    // paliers ronds (dizaines/centaines) plutôt que défiler chiffre par chiffre.
    //
    // Gère aussi les décimales (virgule ou point) : "1,3 Md€" défile par pas de
    // 0,1 (0,0 → 0,1 → … → 1,3), la virgule et le suffixe sont conservés.
    //
    // On extrait la partie numérique via regex, on anime UN OBJET intermédiaire
    // { value: 0 } avec GSAP, et à chaque frame on arrondit au multiple du pas
    // avant d'afficher. Le pas est choisi dans une liste de valeurs "rondes"
    // proche de target/40.
    "count-up": (el, opts) => {
      var _a, _b, _c;
      const rawText = el.textContent.trim();
      const match = rawText.match(/^(.*?)(\d[\d\s]*(?:[.,]\d+)?)(.*)$/);
      if (!match) return window.gsap.timeline();
      const prefix = match[1];
      const numberGroup = match[2];
      const suffix = match[3];
      const decSep = numberGroup.includes(",") ? "," : ".";
      const hasDecimals = /[.,]\d+$/.test(numberGroup);
      const decimals = hasDecimals ? numberGroup.split(/[.,]/).pop().length : 0;
      const targetNumber = parseFloat(numberGroup.replace(/\s/g, "").replace(",", "."));
      if (isNaN(targetNumber)) return window.gsap.timeline();
      const NICE_STEPS = decimals ? [0.1, 0.2, 0.5, 1, 2, 5, 10] : [1, 2, 5, 10, 25, 50, 100, 250, 500, 1e3, 2500, 5e3, 1e4];
      const idealStep = targetNumber / 40;
      const minStep = decimals ? Math.pow(10, -decimals) : 1;
      const step = NICE_STEPS.find((s) => s >= Math.max(idealStep, minStep)) || NICE_STEPS[NICE_STEPS.length - 1];
      const format = (n) => {
        if (decimals) {
          return n.toFixed(decimals).replace(".", decSep);
        }
        return numberGroup.includes(" ") ? n.toLocaleString("fr-FR").replace(/,/g, " ").replace(/\u202f/g, " ") : String(n);
      };
      const counter = { value: 0 };
      el.textContent = `${prefix}${format(0)}${suffix}`;
      return window.gsap.to(counter, {
        value: targetNumber,
        duration: (_a = opts == null ? void 0 : opts.duration) != null ? _a : 1.5,
        delay: (_b = opts == null ? void 0 : opts.delay) != null ? _b : 0,
        ease: (_c = opts == null ? void 0 : opts.ease) != null ? _c : "power1.out",
        onUpdate: () => {
          const stepped = Math.min(Math.round(counter.value / step) * step, targetNumber);
          el.textContent = `${prefix}${format(stepped)}${suffix}`;
        },
        onComplete: () => {
          el.textContent = rawText;
        }
      });
    },
    // Reveal "rideau" sur une image : une boîte (overflow:hidden) grandit en
    // hauteur de 0 à 100%, révélant l'image du haut vers le bas. L'image
    // garde une hauteur FIXE en pixels égale à celle du wrapper (position
    // absolute), pour ne jamais être étirée/écrasée pendant que la boîte
    // grandit — seule la partie visible change, la boîte agit comme un cache
    // qui se rétracte.
    //
    // Un overlay noir est posé DANS box (donc rogné progressivement en même
    // temps que l'image, pas visible en entier dès le départ) : opacity
    // démarre à 1 (plein noir) et descend à 0 vers la fin de l'animation de
    // hauteur, chevauchement piloté par opts.overlayStart (fraction de la
    // durée totale où le fondu démarre).
    //
    // Le délai (opts.delay, calculé par siblingIndex() dans scan.js pour
    // décaler les éléments d'une même liste) est appliqué sur la TIMELINE
    // entière (gsap.timeline({ delay })), pas sur chaque .to() individuel —
    // sinon, positionnés à des offsets absolus internes à la timeline, ils
    // démarreraient toujours immédiatement au moment où ScrollTrigger
    // déclenche .play(), quel que soit opts.delay.
    //
    // À poser sur le WRAPPER qui contient l'image (pas sur l'<img> lui-même).
    // La hauteur du wrapper est figée explicitement (el.style.height) AVANT
    // de repositionner l'<img> en absolute — sinon, une fois l'image sortie
    // du flux normal, le wrapper (s'il n'a pas de hauteur CSS fixe) s'effondre
    // à 0px. Hauteur mesurée UNE SEULE FOIS à l'init (pas de resize handler).
    "image-wipe": (el, opts) => {
      var _a, _b, _c, _d;
      const img = el.querySelector("img");
      if (!img) return window.gsap.timeline();
      const height = el.offsetHeight;
      if (getComputedStyle(el).position === "static") {
        el.style.position = "relative";
      }
      el.style.overflow = "hidden";
      el.style.height = `${height}px`;
      const box = document.createElement("div");
      box.className = "img-reveal-box";
      Object.assign(box.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "0px",
        overflow: "hidden"
      });
      Object.assign(img.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: `${height}px`,
        objectFit: img.style.objectFit || "cover"
      });
      box.appendChild(img);
      const overlay = document.createElement("div");
      overlay.className = "img-reveal-overlay";
      Object.assign(overlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: `${height}px`,
        background: opts.overlayColor || "#000",
        opacity: "1",
        pointerEvents: "none",
        zIndex: "1"
      });
      box.appendChild(overlay);
      el.appendChild(box);
      const duration = (_a = opts.duration) != null ? _a : 1.1;
      const overlayStart = (_b = opts.overlayStart) != null ? _b : 0.55;
      const tl = window.gsap.timeline({ delay: (_c = opts.delay) != null ? _c : 0 });
      tl.to(box, { height, duration, ease: (_d = opts.ease) != null ? _d : "power3.inOut" }, 0);
      tl.to(
        overlay,
        { opacity: 0, duration: duration * (1 - overlayStart) + 0.2, ease: "power1.out" },
        duration * overlayStart
      );
      return tl;
    },
    // Texte révélé mot par mot en fondu simple (opacity/y), sans effet rideau.
    "text-words": (el, opts) => {
      var _a, _b, _c, _d;
      const words = splitWords(el);
      window.gsap.set(words, { opacity: 0, y: 12 });
      return window.gsap.to(words, {
        opacity: 1,
        y: 0,
        duration: (_a = opts.duration) != null ? _a : 0.6,
        delay: (_b = opts.delay) != null ? _b : 0,
        stagger: (_c = opts.stagger) != null ? _c : 0.03,
        ease: (_d = opts.ease) != null ? _d : "power2.out"
      });
    },
    // Titre révélé mot par mot façon "rideau". Déplacement de départ calculé
    // en pixels réels (getHiddenOffsets) plutôt qu'en yPercent — garantit un
    // masquage total même avec le padding ajouté autour de chaque mot pour
    // protéger accents/descendantes.
    heading: (el, opts) => {
      var _a, _b, _c, _d;
      const words = splitWordsMasked(el);
      const offsets = getHiddenOffsets(words);
      window.gsap.set(words, { y: (i) => offsets[i] });
      return window.gsap.to(words, {
        y: 0,
        duration: (_a = opts.duration) != null ? _a : 0.7,
        delay: (_b = opts.delay) != null ? _b : 0,
        stagger: (_c = opts.stagger) != null ? _c : 0.04,
        ease: (_d = opts.ease) != null ? _d : "power3.out"
      });
    }
  };

  // src/animate/scan.js
  function readOpts(el) {
    return {
      delay: el.dataset.animDelay ? parseFloat(el.dataset.animDelay) : void 0,
      duration: el.dataset.animDuration ? parseFloat(el.dataset.animDuration) : void 0,
      stagger: el.dataset.animStagger ? parseFloat(el.dataset.animStagger) : void 0,
      distance: el.dataset.animDistance ? parseFloat(el.dataset.animDistance) : void 0,
      scale: el.dataset.animScale ? parseFloat(el.dataset.animScale) : void 0,
      overlayStart: el.dataset.animOverlayStart ? parseFloat(el.dataset.animOverlayStart) : void 0,
      overlayColor: el.dataset.animOverlayColor || void 0
    };
  }
  function siblingIndex(el) {
    const presetName = el.dataset.inview;
    let ancestor = el.parentElement;
    while (ancestor) {
      const matches = Array.from(ancestor.querySelectorAll(`[data-inview="${presetName}"]`));
      if (matches.length > 1) {
        return matches.indexOf(el);
      }
      ancestor = ancestor.parentElement;
    }
    return 0;
  }
  function attachTrigger(el, animation, opts) {
    const start = el.dataset.animStart || "top 85%";
    const repeat = el.dataset.animRepeat === "true";
    animation.pause();
    window.ScrollTrigger.create({
      trigger: el,
      start,
      fastScrollEnd: true,
      onEnter: (self) => {
        el.classList.add("--visible");
        if (self.progress === 1 || el.getBoundingClientRect().bottom < 0) {
          animation.progress(1);
        } else {
          animation.play();
        }
      },
      onEnterBack: () => {
        if (repeat) {
          el.classList.add("--visible");
          animation.play();
        }
      },
      onLeaveBack: () => {
        if (repeat) {
          el.classList.remove("--visible");
          animation.pause(0);
        }
      }
    });
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add("--visible");
      animation.play();
    } else if (rect.bottom <= 0 && window.scrollY > 200) {
      el.classList.add("--visible");
      animation.progress(1);
    }
  }
  function runGridReveal(grid, isRefilter = false) {
    var _a;
    const presetName = grid.dataset.gridReveal || "image-reveal";
    const preset = PRESETS[presetName];
    if (!preset) return;
    const opts = readOpts(grid);
    const staggerStep = (_a = opts.stagger) != null ? _a : 0.08;
    const allItems = Array.from(
      grid.querySelectorAll(".w-dyn-item, :scope > [data-anim-item], :scope > *")
    );
    const visibleItems = allItems.filter((item) => {
      const style = window.getComputedStyle(item);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && item.offsetHeight > 0;
    });
    if (!visibleItems.length) return;
    if (grid._gridRevealTl) {
      grid._gridRevealTl.kill();
      grid._gridRevealTl = null;
    }
    const firstTop = visibleItems[0].offsetTop;
    const tolerance = 25;
    const firstRowTargets = [];
    const otherTargets = [];
    visibleItems.forEach((item) => {
      const target = item.querySelector("[data-anim-target]") || item;
      const isFirstRow = Math.abs(item.offsetTop - firstTop) <= tolerance;
      if (isFirstRow) {
        firstRowTargets.push(target);
      } else {
        otherTargets.push(target);
      }
    });
    otherTargets.forEach((target) => {
      target.classList.add("--visible");
      window.gsap.set(target, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
    });
    const tl = window.gsap.timeline({ paused: true });
    grid._gridRevealTl = tl;
    firstRowTargets.forEach((target, index) => {
      target.classList.remove("--visible");
      window.gsap.killTweensOf(target);
      const itemAnim = preset(target, { ...opts, delay: 0 });
      tl.add(itemAnim, index * staggerStep);
    });
    if (isRefilter) {
      firstRowTargets.forEach((t) => t.classList.add("--visible"));
      tl.play(0);
      return;
    }
    const start = grid.dataset.animStart || "top 95%";
    window.ScrollTrigger.create({
      trigger: grid,
      start,
      fastScrollEnd: true,
      onEnter: (self) => {
        firstRowTargets.forEach((t) => t.classList.add("--visible"));
        const rect2 = grid.getBoundingClientRect();
        if (self.progress === 1 || rect2.bottom < 0) {
          tl.progress(1);
        } else {
          tl.play();
        }
      }
    });
    const rect = grid.getBoundingClientRect();
    const hasAlreadyScrolledPast = window.scrollY > 200 && rect.bottom < 0;
    if (hasAlreadyScrolledPast) {
      firstRowTargets.forEach((t) => t.classList.add("--visible"));
      tl.progress(1);
    } else if (rect.top < window.innerHeight) {
      firstRowTargets.forEach((t) => t.classList.add("--visible"));
      tl.play();
    }
  }
  function scanAnimations(root = document) {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    const grids = root.querySelectorAll("[data-grid-reveal]");
    grids.forEach((grid) => runGridReveal(grid, false));
    if (grids.length) {
      const triggerRefilter = () => {
        setTimeout(() => {
          grids.forEach((grid) => runGridReveal(grid, true));
        }, 50);
      };
      const filterForms = root.querySelectorAll('[fs-list-element="filters"], form.blog-list_filter-form-flex');
      filterForms.forEach((form) => {
        form.addEventListener("change", triggerRefilter);
        form.addEventListener("input", triggerRefilter);
        form.addEventListener("reset", triggerRefilter);
      });
      root.querySelectorAll('[fs-list-element="clear"]').forEach((btn) => {
        btn.addEventListener("click", triggerRefilter);
      });
      window.FinsweetAttributes = window.FinsweetAttributes || [];
      window.FinsweetAttributes.push([
        "list",
        (listInstances) => {
          listInstances.forEach((listInstance) => {
            if (typeof listInstance.addHook === "function") {
              listInstance.addHook("afterRender", () => {
                triggerRefilter();
              });
            }
          });
        }
      ]);
    }
    root.querySelectorAll("[data-inview]").forEach((el) => {
      var _a, _b;
      const presetName = el.dataset.inview;
      const preset = PRESETS[presetName];
      if (!preset) return;
      const opts = readOpts(el);
      const STAGGER_BY_PRESET = {
        "count-up": { step: 0.25, max: 1 }
      };
      const cfg = STAGGER_BY_PRESET[presetName] || { step: 0.08, max: 0.3 };
      const staggerStep = (_a = opts.stagger) != null ? _a : cfg.step;
      const extraDelay = Math.min(siblingIndex(el) * staggerStep, cfg.max);
      opts.delay = ((_b = opts.delay) != null ? _b : 0) + extraDelay;
      const animation = preset(el, opts);
      attachTrigger(el, animation, opts);
    });
    root.querySelectorAll("[data-text-reveal]").forEach((el) => {
      const opts = readOpts(el);
      const animation = PRESETS.heading(el, opts);
      attachTrigger(el, animation, opts);
    });
    root.querySelectorAll("[data-grid-enter]").forEach((group) => {
      const items = Array.from(group.querySelectorAll(":scope > [data-anim-item]"));
      if (!items.length) return;
      const presetName = items[0].dataset.animItem;
      const preset = PRESETS[presetName];
      if (!preset) return;
      const opts = readOpts(group);
      const animations = items.map((item) => preset(item, readOpts(item)));
      animations.forEach((a) => a.pause());
      const tl = window.gsap.timeline({ paused: true });
      animations.forEach((a, i) => {
        var _a;
        tl.add(a.play(), i * ((_a = opts.stagger) != null ? _a : 0.1));
      });
      attachTrigger(group, tl, opts);
    });
  }

  // src/animate/parallax.js
  function initOne(el) {
    const speed = parseFloat(el.dataset.parallaxSpeed) || 0.15;
    const start = el.dataset.parallaxStart || "top bottom";
    const end = el.dataset.parallaxEnd || "bottom top";
    const scale = 1 + Math.max(speed * 1.5, 0.12);
    window.gsap.set(el, {
      scale,
      transformOrigin: "center center",
      willChange: "transform"
    });
    window.gsap.to(el, {
      yPercent: speed * 50,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start,
        end,
        scrub: true
      }
    });
  }
  function initParallax(root = document) {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    root.querySelectorAll("[data-parallax]").forEach((el) => {
      if (el instanceof HTMLImageElement || el instanceof HTMLElement) {
        initOne(el);
      }
    });
  }

  // src/animate/hero-parallax.js
  function initOne2(el) {
    const speed = parseFloat(el.dataset.heroParallaxSpeed) || 0.15;
    const smooth = parseFloat(el.dataset.heroParallaxSmooth) || 1;
    const start = el.dataset.heroParallaxStart || "top top";
    const end = el.dataset.heroParallaxEnd || "bottom top";
    const container = el.dataset.heroParallaxContainer ? el.closest(el.dataset.heroParallaxContainer) : el.parentElement;
    if (!container) return;
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    container.style.overflow = "hidden";
    Object.assign(el.style, {
      position: "absolute",
      top: `${-speed * 100}%`,
      left: "0",
      width: "100%",
      height: `${(1 + speed) * 100}%`,
      objectFit: el.style.objectFit || "cover",
      willChange: "transform"
    });
    const shift = speed / (1 + speed) * 100;
    window.gsap.fromTo(
      el,
      { y: 0, yPercent: 0, force3D: true },
      {
        y: 0,
        yPercent: shift,
        ease: "none",
        force3D: true,
        scrollTrigger: {
          trigger: container,
          start,
          end,
          scrub: smooth,
          invalidateOnRefresh: true
        }
      }
    );
  }
  function initHeroParallax(root = document) {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    root.querySelectorAll("[data-hero-parallax]").forEach((el) => {
      if (el instanceof HTMLElement) initOne2(el);
    });
  }

  // src/animate/blur-placeholder.js
  function initOne3(img) {
    const srcset = img.getAttribute("srcset");
    if (!srcset) return;
    const smallest = srcset.split(",")[0].trim().split(" ")[0];
    if (!smallest) return;
    const parent = img.parentElement;
    if (!parent) return;
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
      transform: "scale(1.1)",
      // evite les bords clairs dus au flou
      transition: `opacity ${duration}s ease`,
      pointerEvents: "none"
    });
    parent.insertBefore(ph, img);
    const done = () => {
      ph.style.opacity = "0";
      setTimeout(() => ph.remove(), duration * 1e3 + 50);
    };
    if (img.decode) img.decode().then(done).catch(done);
    else img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  }
  function initBlurPlaceholders(root = document) {
    root.querySelectorAll("img[data-blur]").forEach(initOne3);
  }

  // src/animate/text-progress.js
  var DEFAULT_FROM = 0.2;
  var DEFAULT_START = "top 80%";
  var DEFAULT_END = "bottom 40%";
  function num(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function splitWords2(el) {
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
  function initTextProgress(root = document) {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.querySelectorAll("[data-text-progress]:not([data-text-progress-ready])").forEach((el) => {
      el.setAttribute("data-text-progress-ready", "true");
      const d = el.dataset;
      const words = splitWords2(el);
      if (!words.length) return;
      const scrubAttr = d.textProgressScrub;
      const scrub = scrubAttr === void 0 ? true : num(scrubAttr, true);
      window.gsap.set(words, { opacity: num(d.textProgressFrom, DEFAULT_FROM) });
      window.gsap.to(words, {
        opacity: 1,
        ease: "none",
        stagger: 1,
        // une unité par mot : progression mot après mot
        scrollTrigger: {
          trigger: el,
          start: d.textProgressStart || DEFAULT_START,
          end: d.textProgressEnd || DEFAULT_END,
          scrub,
          invalidateOnRefresh: true
        },
        duration: 1
      });
    });
  }

  // src/animate/index.js
  function initAnimations(root = document) {
    initBlurPlaceholders(root);
    if (prefersReducedMotion()) return;
    setupGsap();
    scanAnimations(root);
    initParallax(root);
    initHeroParallax(root);
    initTextProgress(root);
  }

  // src/animate/svg-trace.js
  var SVG_NS2 = "http://www.w3.org/2000/svg";
  function createFadeGradient2(svg, color) {
    const gradientId = `trace-fade-${Math.random().toString(36).slice(2, 9)}`;
    const gradient = document.createElementNS(SVG_NS2, "linearGradient");
    gradient.setAttribute("id", gradientId);
    gradient.setAttribute("gradientUnits", "userSpaceOnUse");
    [
      { offset: "0", opacity: "0" },
      { offset: "0.5", opacity: "1" },
      { offset: "1", opacity: "0" }
    ].forEach(({ offset, opacity }) => {
      const stop = document.createElementNS(SVG_NS2, "stop");
      stop.setAttribute("offset", offset);
      stop.setAttribute("stop-color", color);
      stop.setAttribute("stop-opacity", opacity);
      gradient.appendChild(stop);
    });
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVG_NS2, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    defs.appendChild(gradient);
    return { gradient, gradientId };
  }
  function initTrace(path) {
    const svg = path.closest("svg");
    if (!svg) return;
    const totalLength = path.getTotalLength();
    const segmentLength = parseFloat(path.dataset.traceLength) || totalLength * 0.08;
    const duration = parseFloat(path.dataset.traceDuration) || 4;
    const color = path.dataset.traceColor || getComputedStyle(path).stroke || "#1A1A1A";
    const startFraction = parseFloat(path.dataset.traceOffset) || 0;
    const startOffset = startFraction * totalLength;
    const { gradient } = createFadeGradient2(svg, color);
    path.style.fill = "none";
    path.style.stroke = `url(#${gradient.id})`;
    path.style.strokeDasharray = `${segmentLength} ${totalLength - segmentLength}`;
    path.style.strokeDashoffset = `${startOffset}`;
    function updateGradient() {
      const raw = -window.gsap.getProperty(path, "strokeDashoffset");
      const start = (raw % totalLength + totalLength) % totalLength;
      const end = (start + segmentLength) % totalLength;
      const p1 = path.getPointAtLength(start);
      const p2 = path.getPointAtLength(end);
      gradient.setAttribute("x1", p1.x);
      gradient.setAttribute("y1", p1.y);
      gradient.setAttribute("x2", p2.x);
      gradient.setAttribute("y2", p2.y);
    }
    window.gsap.to(path, {
      strokeDashoffset: startOffset - totalLength,
      duration,
      ease: "none",
      repeat: -1,
      onUpdate: updateGradient
    });
    updateGradient();
  }
  function initSvgTrace(root = document) {
    if (typeof window.gsap === "undefined") return;
    root.querySelectorAll("[data-svg-trace]").forEach((path) => {
      if (path instanceof SVGPathElement) {
        initTrace(path);
      } else {
        console.warn("[svg-trace] l'\xE9l\xE9ment data-svg-trace n'est pas un <path>", path);
      }
    });
  }

  // src/animate/dot-arrow.js
  function getMainDots(svg) {
    return Array.from(svg.querySelectorAll("circle")).filter((c) => {
      const attr = c.getAttribute("fill-opacity");
      return attr === null || parseFloat(attr) === 1;
    });
  }
  function sortDots(dots) {
    return dots.sort((a, b) => {
      const dy = parseFloat(a.getAttribute("cy")) - parseFloat(b.getAttribute("cy"));
      if (Math.abs(dy) > 0.5) return dy;
      return parseFloat(a.getAttribute("cx")) - parseFloat(b.getAttribute("cx"));
    });
  }
  function initArrow(svg) {
    const dots = sortDots(getMainDots(svg));
    if (!dots.length) return;
    const duration = parseFloat(svg.dataset.arrowDuration) || 0.2;
    const overlap = svg.dataset.arrowOverlap !== void 0 ? parseFloat(svg.dataset.arrowOverlap) : 0.85;
    const finalOpacity = svg.dataset.arrowOpacity !== void 0 ? parseFloat(svg.dataset.arrowOpacity) : 0.12;
    const step = duration * (1 - Math.min(Math.max(overlap, 0), 0.95));
    const targets = dots.map((dot) => {
      const prev = dot.previousElementSibling;
      return prev && prev.tagName.toLowerCase() === "foreignobject" ? [prev, dot] : [dot];
    });
    const tl = window.gsap.timeline({ paused: true });
    targets.forEach((els, i) => {
      tl.to(els, { opacity: finalOpacity, duration, ease: "power2.out" }, i * step);
    });
    const trigger = svg.closest("a, button") || svg;
    trigger.addEventListener("mouseenter", () => tl.timeScale(1).play());
    trigger.addEventListener("mouseleave", () => tl.timeScale(1.3).reverse());
  }
  function initDotArrow(root = document) {
    if (typeof window.gsap === "undefined") return;
    root.querySelectorAll("[data-dot-arrow]").forEach((svg) => {
      if (svg instanceof SVGSVGElement) {
        initArrow(svg);
      } else {
        console.warn("[dot-arrow] l'\xE9l\xE9ment data-dot-arrow n'est pas un <svg>", svg);
      }
    });
  }

  // src/list-lenis-sync.js
  function initListLenisSync() {
    var _a;
    if (typeof window.FinsweetAttributes === "undefined") return;
    const listModule = (_a = window.FinsweetAttributes.modules) == null ? void 0 : _a.list;
    if (!listModule || !listModule.loading) return;
    listModule.loading.then((listInstances) => {
      listInstances.forEach((instance) => {
        if (typeof instance.addHook !== "function") return;
        instance.addHook("afterRender", () => {
          const lenis = getLenis();
          if (!lenis) return;
          requestAnimationFrame(() => {
            lenis.resize();
          });
        });
      });
    });
  }

  // src/focus-stories.js
  var CTA_TEXT_SELECTOR = ".focus-card_cta .text-block";
  function extractSlide(card) {
    const img = card.querySelector(".focus-card_image");
    const linkedinLink = card.querySelector(".img_wrapper_linkedin");
    const titleBlock = card.querySelector(".focus-card_header");
    const footerTop = card.querySelector(".focus-card_footer-top");
    const heading = card.querySelector(".focus-card_header h2");
    const fullName = heading ? heading.textContent.trim() : "";
    const firstName = fullName.split(/\s+/)[0] || "";
    return {
      imgSrc: img ? img.src : "",
      imgAlt: img ? img.alt : "",
      linkedinHref: linkedinLink ? linkedinLink.getAttribute("href") : "#",
      titleHTML: titleBlock ? titleBlock.innerHTML : "",
      footerTopHTML: footerTop ? footerTop.innerHTML : "",
      firstName
    };
  }
  function buildProgressSteps(progressEl, count) {
    if (!progressEl) return [];
    progressEl.innerHTML = "";
    const steps = [];
    for (let i = 0; i < count; i++) {
      const step = document.createElement("div");
      step.className = "focus-card_progress-step";
      const fill = document.createElement("div");
      fill.className = "focus-card_progress-fill";
      step.appendChild(fill);
      progressEl.appendChild(step);
      steps.push(step);
    }
    return steps;
  }
  function initFocusStories(root = document) {
    const sections = root.querySelectorAll(".section_focus");
    sections.forEach((section) => {
      const cards = Array.from(section.querySelectorAll(".focus-card"));
      if (cards.length < 2) return;
      const duration = parseFloat(section.dataset.focusDuration) || 5;
      const transitionDuration = parseFloat(section.dataset.focusTransition) || 0.6;
      const titleStagger = parseFloat(section.dataset.focusTitleStagger) || 0.04;
      const quoteStagger = parseFloat(section.dataset.focusQuoteStagger) || 0.08;
      const quoteDuration = parseFloat(section.dataset.focusQuoteDuration) || 0.9;
      const mainCard = cards[0];
      const ctaTemplateEl = mainCard.querySelector(CTA_TEXT_SELECTOR);
      const ctaTemplate = ctaTemplateEl ? ctaTemplateEl.textContent.trim() : "";
      const slides = cards.map(extractSlide);
      cards.slice(1).forEach((card) => card.remove());
      const imgWrapper = mainCard.querySelector(".focus-card_image-wrapper");
      let currentImg = mainCard.querySelector(".focus-card_image");
      const linkedinLink = mainCard.querySelector(".img_wrapper_linkedin");
      const titleBlock = mainCard.querySelector(".focus-card_header");
      const footerTop = mainCard.querySelector(".focus-card_footer-top");
      const progressEl = mainCard.querySelector(".focus-card_progress");
      const steps = buildProgressSteps(progressEl, slides.length);
      let index = 0;
      let progressTween = null;
      let isInView = false;
      function swapImage(newSrc, newAlt) {
        if (!imgWrapper || !currentImg) return;
        const nextImg = currentImg.cloneNode(false);
        nextImg.src = newSrc;
        nextImg.alt = newAlt;
        nextImg.classList.remove("is-active", "is-entering", "is-leaving");
        nextImg.classList.add("is-entering");
        imgWrapper.appendChild(nextImg);
        currentImg.classList.remove("is-entering");
        currentImg.classList.add("is-leaving");
        void nextImg.offsetWidth;
        nextImg.classList.remove("is-entering");
        nextImg.classList.add("is-active");
        const oldImg = currentImg;
        currentImg = nextImg;
        oldImg.addEventListener(
          "transitionend",
          () => {
            oldImg.remove();
          },
          { once: true }
        );
        setTimeout(() => {
          if (oldImg.parentNode) oldImg.remove();
        }, transitionDuration * 1e3 + 100);
      }
      function animateTitle() {
        if (!titleBlock || typeof window.gsap === "undefined") return;
        const heading = titleBlock.querySelector("h2");
        if (!heading) return;
        PRESETS.heading(heading, { stagger: titleStagger });
      }
      function animateQuote() {
        if (!footerTop || typeof window.gsap === "undefined" || typeof window.SplitText === "undefined") return;
        const quote = footerTop.querySelector(".focus-card_footer-quote");
        if (!quote) return;
        const split = new window.SplitText(quote, {
          type: "lines",
          mask: "lines"
        });
        window.gsap.set(split.lines, { yPercent: 110, opacity: 0 });
        window.gsap.to(split.lines, {
          yPercent: 0,
          opacity: 1,
          duration: quoteDuration,
          stagger: quoteStagger,
          ease: "power3.out"
        });
      }
      function applySlide(i) {
        const slide = slides[i];
        swapImage(slide.imgSrc, slide.imgAlt);
        if (linkedinLink) linkedinLink.setAttribute("href", slide.linkedinHref);
        if (titleBlock) titleBlock.innerHTML = slide.titleHTML;
        if (footerTop) footerTop.innerHTML = slide.footerTopHTML;
        const ctaText = footerTop ? footerTop.querySelector(CTA_TEXT_SELECTOR) : null;
        if (ctaText && ctaTemplate) {
          ctaText.textContent = ctaTemplate.replace("{name}", slide.firstName || "");
        }
        if (footerTop) initDotArrow(footerTop);
        animateTitle();
        animateQuote();
      }
      function startProgress(i) {
        if (!steps.length) return;
        if (progressTween) {
          progressTween.kill();
          progressTween = null;
        }
        steps.forEach((step, si) => {
          const fill = step.querySelector(".focus-card_progress-fill");
          if (si < i) {
            window.gsap.set(fill, { scaleX: 1, transformOrigin: "left center" });
          } else if (si > i) {
            window.gsap.set(fill, { scaleX: 0, transformOrigin: "left center" });
          }
        });
        const currentFill = steps[i].querySelector(".focus-card_progress-fill");
        window.gsap.set(currentFill, { scaleX: 0, transformOrigin: "left center" });
        progressTween = window.gsap.to(currentFill, {
          scaleX: 1,
          duration,
          ease: "none",
          paused: !isInView,
          // Reste en pause tant que pas dans le viewport
          onComplete: next
        });
      }
      function showSlide(i) {
        applySlide(i);
        startProgress(i);
      }
      function next() {
        index = (index + 1) % slides.length;
        showSlide(index);
      }
      applySlide(index);
      steps.forEach((step, si) => {
        const fill = step.querySelector(".focus-card_progress-fill");
        window.gsap.set(fill, { scaleX: si < index ? 1 : 0, transformOrigin: "left center" });
      });
      startProgress(index);
      if (typeof window.ScrollTrigger !== "undefined") {
        window.ScrollTrigger.create({
          trigger: section,
          start: "top 90%",
          end: "bottom 10%",
          onEnter: () => {
            isInView = true;
            if (progressTween) progressTween.play();
          },
          onLeave: () => {
            isInView = false;
            if (progressTween) progressTween.pause();
          },
          onEnterBack: () => {
            isInView = true;
            if (progressTween) progressTween.play();
          },
          onLeaveBack: () => {
            isInView = false;
            if (progressTween) progressTween.pause();
          }
        });
      } else {
        isInView = true;
        if (progressTween) progressTween.play();
      }
    });
  }

  // src/video-section.js
  var PLYR_I18N_FR2 = {
    play: "Lire",
    pause: "Pause",
    mute: "Couper le son",
    unmute: "Activer le son",
    enableCaptions: "Activer les sous-titres",
    disableCaptions: "D\xE9sactiver les sous-titres",
    enterFullscreen: "Plein \xE9cran",
    exitFullscreen: "Quitter le plein \xE9cran"
  };
  var DEFAULT_MAGNET = 0.35;
  var DEFAULT_AUTOPLAY_DELAY = 0;
  var FADE_MS = 350;
  var REVEAL_TIMEOUT_MS = 4e3;
  var PREVIEW_REVEAL_TIMEOUT_MS = 2500;
  function getVideoInfo2(src) {
    const s = (src || "").trim();
    const short = s.match(/^(youtube|vimeo):([\w-]+)(?:[/:]([\w]+))?$/i);
    if (short) {
      const type = short[1].toLowerCase();
      const id = short[2];
      const hash = short[3] || "";
      if (type === "vimeo") {
        return {
          type,
          id,
          hash,
          url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`
        };
      }
      return { type, id, hash: "", url: `https://www.youtube.com/watch?v=${id}` };
    }
    const yt = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (yt) return { type: "youtube", id: yt[1], hash: "", url: s };
    const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
    if (vimeo) {
      return { type: "vimeo", id: vimeo[1], hash: vimeo[2] || "", url: s };
    }
    return { type: "native", id: null, hash: "", url: s };
  }
  function buildPlayerMarkup2(src, captions, title, preview = false, startAt = 0) {
    const info = getVideoInfo2(src);
    const frameTitle = title || "Lecteur vid\xE9o";
    if (info.type === "youtube" || info.type === "vimeo") {
      const embedId = info.type === "vimeo" && info.hash ? info.url : info.id;
      return `<div class="plyr__video-embed" data-plyr-provider="${info.type}" data-plyr-embed-id="${embedId}" title="${frameTitle}"></div>`;
    }
    if (preview) {
      const frag = startAt > 0 ? `#t=${startAt}` : "";
      return `<video playsinline muted preload="auto"><source src="${info.url}${frag}" type="video/mp4"></video>`;
    }
    const track = captions ? `<track kind="captions" label="Fran\xE7ais" srclang="fr" src="${captions}" default>` : "";
    return `<video playsinline preload="metadata"><source src="${info.url}" type="video/mp4">${track}</video>`;
  }
  function formatDuration2(seconds) {
    if (!seconds || !isFinite(seconds)) return "";
    const total = Math.round(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor(total % 3600 / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  function setTimer(timerEl, text) {
    if (!timerEl || !text) return;
    timerEl.textContent = text;
    timerEl.classList.add("is-ready");
  }
  function loadDuration(src, timerEl, fallback) {
    if (!timerEl) return;
    timerEl.textContent = "";
    if (fallback) setTimer(timerEl, fallback);
    const info = getVideoInfo2(src);
    if (info.type === "native") {
      const probe = document.createElement("video");
      probe.preload = "metadata";
      probe.muted = true;
      probe.playsInline = true;
      const done = () => {
        setTimer(timerEl, formatDuration2(probe.duration));
        probe.removeAttribute("src");
        probe.load();
      };
      probe.addEventListener("loadedmetadata", done, { once: true });
      probe.addEventListener("error", () => {
      }, { once: true });
      probe.src = info.url;
      probe.load();
      return;
    }
    if (info.type === "vimeo" && typeof fetch === "function") {
      fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(info.url)}`).then((r) => r.ok ? r.json() : null).then((d) => {
        if (d && d.duration) setTimer(timerEl, formatDuration2(d.duration));
      }).catch(() => {
      });
    }
  }
  function initMagnet(scope, mover, anchor, strength) {
    if (!scope || !mover || !anchor || !strength) return;
    if (window.matchMedia && (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      return;
    }
    const RADIUS = 160;
    const MAX = 14;
    const EASE = 0.14;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = null;
    function render() {
      cx += (tx - cx) * EASE;
      cy += (ty - cy) * EASE;
      mover.style.setProperty("--mx", `${cx.toFixed(2)}px`);
      mover.style.setProperty("--my", `${cy.toFixed(2)}px`);
      const settled = Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05;
      raf = settled ? null : requestAnimationFrame(render);
    }
    function kick() {
      if (!raf) raf = requestAnimationFrame(render);
    }
    function onMove(ev) {
      const rect = anchor.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2 - cx;
      const centerY = rect.top + rect.height / 2 - cy;
      const dx = ev.clientX - centerX;
      const dy = ev.clientY - centerY;
      const dist = Math.hypot(dx, dy);
      if (dist < RADIUS) {
        const pull = (1 - dist / RADIUS) * strength;
        tx = Math.max(-MAX, Math.min(MAX, dx * pull));
        ty = Math.max(-MAX, Math.min(MAX, dy * pull));
      } else {
        tx = 0;
        ty = 0;
      }
      kick();
    }
    function reset() {
      tx = 0;
      ty = 0;
      kick();
    }
    scope.addEventListener("mousemove", onMove);
    scope.addEventListener("mouseleave", reset);
  }
  var activeStop = null;
  function claimPlayback(stop) {
    if (activeStop && activeStop !== stop) activeStop();
    activeStop = stop;
  }
  function setupPlayback({
    root,
    host,
    trigger,
    timerEl,
    src,
    captions,
    title,
    duration,
    magnet,
    autoplay,
    autoplayDelay,
    autoplayStart
  }) {
    loadDuration(src, timerEl, duration);
    const playBtn = trigger && trigger.querySelector(".video_controller-play");
    const magnetScope = root.querySelector("[data-video-magnet-zone]") || root;
    initMagnet(magnetScope, trigger, playBtn, magnet);
    let holder = null;
    let player = null;
    let revealTimer = null;
    let cleanupTimer = null;
    let previewHolder = null;
    let previewPlayer = null;
    let previewTimer = null;
    let previewRevealTimer = null;
    let previewPaused = false;
    let inView = true;
    const isNative = getVideoInfo2(src).type === "native";
    function blockLink(ev) {
      if (holder && holder.contains(ev.target)) ev.preventDefault();
    }
    function clearPreviewTimer() {
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = null;
      }
    }
    function stopPreview() {
      clearPreviewTimer();
      clearTimeout(previewRevealTimer);
      previewRevealTimer = null;
      if (previewPlayer) {
        try {
          previewPlayer.destroy();
        } catch (e) {
        }
        previewPlayer = null;
      }
      if (previewHolder) {
        previewHolder.remove();
        previewHolder = null;
      }
      previewPaused = false;
      root.classList.remove("is-previewing");
    }
    function pausePreview() {
      clearPreviewTimer();
      if (!previewHolder || previewPaused) return;
      previewPaused = true;
      try {
        if (previewPlayer) previewPlayer.pause();
        else {
          const v = previewHolder.querySelector("video");
          if (v) v.pause();
        }
      } catch (e) {
      }
    }
    function resumePreview() {
      var _a;
      if (!previewHolder || !previewPaused) return;
      previewPaused = false;
      try {
        const p = previewPlayer ? previewPlayer.play() : (_a = previewHolder.querySelector("video")) == null ? void 0 : _a.play();
        if (p && typeof p.catch === "function") p.catch(() => {
        });
      } catch (e) {
      }
    }
    function startPreview() {
      if (previewHolder || holder) return;
      previewHolder = document.createElement("div");
      previewHolder.className = "video_preview-holder swiper-no-swiping";
      previewHolder.setAttribute("aria-hidden", "true");
      previewHolder.innerHTML = buildPlayerMarkup2(src, "", title, true, autoplayStart);
      host.appendChild(previewHolder);
      const ph = previewHolder;
      let revealed = false;
      const reveal = () => {
        if (revealed || previewHolder !== ph) return;
        revealed = true;
        clearTimeout(previewRevealTimer);
        ph.classList.add("is-ready");
        root.classList.add("is-previewing");
      };
      previewRevealTimer = setTimeout(reveal, PREVIEW_REVEAL_TIMEOUT_MS);
      const target = previewHolder.firstElementChild;
      if (typeof window.Plyr === "undefined") {
        if (target.tagName === "VIDEO") {
          target.muted = true;
          target.addEventListener("playing", reveal, { once: true });
          target.addEventListener("ended", () => {
            target.currentTime = autoplayStart;
            target.play().catch(() => {
            });
          });
          target.play().catch(() => {
          });
        }
        return;
      }
      const pl = new window.Plyr(target, {
        controls: [],
        clickToPlay: false,
        keyboard: { focused: false, global: false },
        fullscreen: { enabled: false },
        // Boucle gérée à la main (voir "ended") pour pouvoir reboucler à autoplayStart
        loop: { active: false },
        tooltips: { controls: false, seek: false }
      });
      previewPlayer = pl;
      pl.once("playing", reveal);
      pl.once("timeupdate", reveal);
      pl.on("ended", () => {
        if (previewPlayer !== pl) return;
        pl.currentTime = autoplayStart;
        const p = pl.play();
        if (p && typeof p.catch === "function") p.catch(() => {
        });
      });
      const run = () => {
        if (previewPlayer !== pl) return;
        pl.muted = true;
        if (autoplayStart > 0 && !isNative) pl.currentTime = autoplayStart;
        if (!inView) {
          previewPaused = true;
          return;
        }
        const p = pl.play();
        if (p && typeof p.catch === "function") p.catch(() => {
        });
      };
      if (isNative) run();
      else pl.once("ready", run);
    }
    function syncPreview() {
      if (!autoplay) return;
      if (inView && !holder) {
        if (previewHolder) {
          resumePreview();
          return;
        }
        if (previewTimer) return;
        if (autoplayDelay <= 0) {
          startPreview();
          return;
        }
        previewTimer = setTimeout(() => {
          previewTimer = null;
          if (inView && !holder) startPreview();
        }, autoplayDelay * 1e3);
      } else {
        pausePreview();
      }
    }
    function stop() {
      clearTimeout(revealTimer);
      clearTimeout(cleanupTimer);
      revealTimer = null;
      cleanupTimer = null;
      if (player) {
        try {
          player.pause();
          player.destroy();
        } catch (e) {
        }
        player = null;
      }
      if (holder) {
        holder.remove();
        holder = null;
      }
      root.removeEventListener("click", blockLink, true);
      root.classList.remove("is-playing");
      if (activeStop === stop) activeStop = null;
      syncPreview();
    }
    function start(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (holder) return;
      claimPlayback(stop);
      clearPreviewTimer();
      root.classList.add("is-playing");
      holder = document.createElement("div");
      holder.className = "video_player-holder swiper-no-swiping";
      holder.innerHTML = buildPlayerMarkup2(src, captions, title);
      host.appendChild(holder);
      root.addEventListener("click", blockLink, true);
      const h = holder;
      let revealed = false;
      const reveal = () => {
        if (revealed || holder !== h) return;
        revealed = true;
        clearTimeout(revealTimer);
        h.classList.add("is-ready");
        cleanupTimer = setTimeout(() => {
          cleanupTimer = null;
          if (holder === h) stopPreview();
        }, FADE_MS + 50);
      };
      revealTimer = setTimeout(reveal, REVEAL_TIMEOUT_MS);
      const target = holder.firstElementChild;
      if (typeof window.Plyr === "undefined") {
        if (target.tagName === "VIDEO") {
          target.controls = true;
          target.addEventListener("playing", reveal, { once: true });
          target.addEventListener("ended", () => stop(), { once: true });
          target.play().catch(() => {
          });
        }
        return;
      }
      const hasCaptions = Boolean(holder.querySelector("track"));
      player = new window.Plyr(target, {
        controls: [
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          ...hasCaptions ? ["captions"] : [],
          "fullscreen"
        ],
        i18n: PLYR_I18N_FR2
      });
      player.once("playing", reveal);
      if (isNative) player.play();
      else player.once("ready", () => player.play());
      player.on("loadedmetadata", () => setTimer(timerEl, formatDuration2(player.duration)));
      player.on("ended", () => stop());
    }
    if (trigger) {
      trigger.setAttribute("role", "button");
      trigger.setAttribute("tabindex", "0");
      trigger.setAttribute("aria-label", "Voir la vid\xE9o");
      trigger.addEventListener("click", start);
      trigger.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          start(ev);
        }
      });
    }
    if (autoplay) {
      if (typeof IntersectionObserver === "undefined") {
        syncPreview();
      } else {
        inView = false;
        new IntersectionObserver(
          ([entry]) => {
            inView = entry.isIntersecting;
            syncPreview();
          },
          { threshold: 0.25 }
        ).observe(root);
      }
    }
  }
  function readMagnet(el) {
    return el.dataset.videoMagnet !== void 0 ? parseFloat(el.dataset.videoMagnet) : DEFAULT_MAGNET;
  }
  function readAutoplay(el) {
    const v = el.dataset.videoAutoplay;
    if (v === void 0 || v === "false") return false;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return false;
    }
    return true;
  }
  function readAutoplayDelay(el) {
    const v = parseFloat(el.dataset.videoAutoplayDelay);
    return isFinite(v) && v >= 0 ? v : DEFAULT_AUTOPLAY_DELAY;
  }
  function readAutoplayStart(el) {
    const v = parseFloat(el.dataset.videoAutoplayStart);
    return isFinite(v) && v > 0 ? v : 0;
  }
  function initOne4(media) {
    const src = media.dataset.videoPlayer;
    if (!src) return;
    const layout = media.closest(".video_layout") || media.parentElement;
    setupPlayback({
      root: layout,
      host: media.querySelector("[data-video-host]") || media,
      trigger: layout.querySelector("[data-video-play]"),
      timerEl: layout.querySelector("[data-video-timer]"),
      src,
      captions: media.dataset.videoCaptions || "",
      title: media.dataset.videoTitle || "",
      duration: media.dataset.videoDuration,
      magnet: readMagnet(media),
      autoplay: readAutoplay(media),
      autoplayDelay: readAutoplayDelay(media),
      autoplayStart: readAutoplayStart(media)
    });
  }
  function initCard(card) {
    const src = card.dataset.videoPlayer;
    if (!src) return;
    setupPlayback({
      root: card,
      host: card.querySelector("[data-video-host]") || card.querySelector(".personas_card-banner") || card,
      trigger: card.querySelector(".video_controller"),
      timerEl: card.querySelector(".video_controller-time"),
      src,
      captions: card.dataset.videoCaptions || "",
      title: card.dataset.videoTitle || "",
      duration: card.dataset.videoDuration,
      magnet: readMagnet(card),
      autoplay: readAutoplay(card),
      autoplayDelay: readAutoplayDelay(card),
      autoplayStart: readAutoplayStart(card)
    });
  }
  function initVideoSection(root = document) {
    root.querySelectorAll("[data-video-player]:not([data-video-ready]):not([data-video-card])").forEach((media) => {
      media.setAttribute("data-video-ready", "true");
      initOne4(media);
    });
    root.querySelectorAll("[data-video-card]:not([data-video-ready])").forEach((card) => {
      card.setAttribute("data-video-ready", "true");
      initCard(card);
    });
  }

  // src/name-tokens.js
  function splitFullName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0] || "";
    const lastName = parts.slice(1).join(" ") || "";
    return { firstName, lastName };
  }
  function walkTextNodes(root, callback) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node2) {
        const tag = node2.parentElement ? node2.parentElement.tagName : "";
        if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let node;
    while (node = walker.nextNode()) {
      callback(node);
    }
  }
  function initNameTokens(root = document) {
    const sourceEl = root.querySelector("[data-name-source]");
    if (!sourceEl) return;
    const attrValue = sourceEl.getAttribute("data-name-source") || "";
    const fullName = (attrValue.trim() || sourceEl.textContent).trim();
    if (!fullName) return;
    const { firstName, lastName } = splitFullName(fullName);
    const scanRoot = root === document ? document.body : root;
    walkTextNodes(scanRoot, (node) => {
      if (node.nodeValue.includes("{name}") || node.nodeValue.includes("{surname}")) {
        node.nodeValue = node.nodeValue.replace(/\{name\}/g, firstName).replace(/\{surname\}/g, lastName);
      }
    });
  }

  // src/nav-hero.js
  function initNavHero() {
    const nav = document.querySelector(".nav_fixed");
    const hero = document.querySelector("[data-nav-hero]");
    if (!nav || !hero) return;
    let observer = null;
    function observe() {
      if (observer) observer.disconnect();
      const navHeight = Math.round(nav.getBoundingClientRect().height);
      observer = new IntersectionObserver(
        ([entry]) => {
          const past = !entry.isIntersecting && entry.boundingClientRect.bottom <= navHeight;
          nav.classList.toggle("is-past-hero", past);
        },
        { rootMargin: `-${navHeight}px 0px 0px 0px`, threshold: 0 }
      );
      observer.observe(hero);
    }
    observe();
    if (typeof ResizeObserver !== "undefined") {
      let last = nav.offsetHeight;
      new ResizeObserver(() => {
        if (nav.offsetHeight !== last) {
          last = nav.offsetHeight;
          observe();
        }
      }).observe(nav);
    }
  }

  // src/animate/hero-bg-parallax.js
  var SCROLL_ATTRS = ["heroBgY", "heroBgX", "heroBgScale", "heroBgRotate"];
  var MOUSE_SMOOTH = 0.9;
  var INTRO_START_DELAY = 0.3;
  var INTRO_DEFAULT_SCALE = 0.8;
  var INTRO_DEFAULT_OPACITY = 0;
  var INTRO_DEFAULT_DURATION = 1.2;
  var INTRO_DEFAULT_EASE = "power2.out";
  var INTRO_STAGGER = 0.35;
  function num2(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function buildLayers(img) {
    if (img.parentNode.classList.contains("hero-bg_frame")) {
      const frame2 = img.parentNode;
      return { intro: frame2.parentNode, frame: frame2 };
    }
    const intro = document.createElement("div");
    intro.className = "hero-bg_intro";
    intro.style.display = "block";
    intro.style.width = "100%";
    intro.style.willChange = "transform, opacity";
    const frame = document.createElement("div");
    frame.className = "hero-bg_frame";
    img.parentNode.insertBefore(intro, img);
    intro.appendChild(frame);
    frame.appendChild(img);
    return { intro, frame };
  }
  function getOrder(el, index) {
    const custom = parseFloat(el.dataset.heroBgOrder);
    if (Number.isFinite(custom)) return custom;
    return 1e3 + index;
  }
  function initHeroBgParallax(root = document) {
    var _a;
    const showAll = () => root.querySelectorAll(".hero-bg_image").forEach((el) => el.classList.add("is-ready"));
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return showAll();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return showAll();
    const hero = root.querySelector(".section_main_hero");
    if (!hero) return showAll();
    const all = Array.from(hero.querySelectorAll(".hero-bg_image")).filter((el) => el.querySelector("img"));
    if (!all.length) return showAll();
    const layers = /* @__PURE__ */ new Map();
    all.forEach((el) => {
      const img = el.querySelector("img");
      layers.set(el, { img, ...buildLayers(img) });
    });
    const orders = all.map((el, i) => getOrder(el, i));
    const minOrder = Math.min(...orders);
    const startDelay = num2(
      (_a = hero.dataset.heroBgIntroStart) != null ? _a : all[0].dataset.heroBgIntroStart,
      INTRO_START_DELAY
    );
    all.forEach((el, i) => {
      const d = el.dataset;
      const { intro } = layers.get(el);
      const delay = startDelay + num2(d.heroBgIntroDelay, (orders[i] - minOrder) * INTRO_STAGGER);
      window.gsap.fromTo(
        intro,
        {
          scale: num2(d.heroBgIntroScale, INTRO_DEFAULT_SCALE),
          opacity: num2(d.heroBgIntroOpacity, INTRO_DEFAULT_OPACITY),
          force3D: true,
          immediateRender: true
          // état de départ appliqué tout de suite (pas de flash pendant le délai)
        },
        {
          scale: 1,
          opacity: 1,
          duration: num2(d.heroBgIntroDuration, INTRO_DEFAULT_DURATION),
          ease: d.heroBgIntroEase || INTRO_DEFAULT_EASE,
          delay,
          force3D: true,
          clearProps: "transform,opacity"
        }
      );
      el.classList.add("is-ready");
    });
    const scrollItems = all.filter((el) => SCROLL_ATTRS.some((a) => el.dataset[a] !== void 0));
    const mouseItems = all.filter((el) => el.dataset.heroBgMouse !== void 0);
    const innerItems = all.filter((el) => num2(el.dataset.heroBgInner, 0) !== 0);
    if (!scrollItems.length && !mouseItems.length && !innerItems.length) return;
    const first = (scrollItems[0] || mouseItems[0] || innerItems[0]).dataset;
    const mm = window.gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const tl = window.gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: first.heroBgStart || "top top",
          end: first.heroBgEnd || "bottom top",
          scrub: num2(first.heroBgScrub, 1),
          invalidateOnRefresh: true
        }
      });
      scrollItems.forEach((el) => {
        const d = el.dataset;
        const { frame } = layers.get(el);
        const delay = Math.min(0.95, Math.max(0, num2(d.heroBgDelay, 0)));
        tl.fromTo(
          frame,
          { x: 0, y: 0, scale: 1, rotation: 0, force3D: true },
          {
            x: num2(d.heroBgX, 0),
            y: num2(d.heroBgY, 0),
            scale: num2(d.heroBgScale, 1),
            rotation: num2(d.heroBgRotate, 0),
            ease: d.heroBgEase || "none",
            force3D: true,
            duration: 1 - delay
          },
          delay
        );
      });
      innerItems.forEach((el) => {
        const amp = num2(el.dataset.heroBgInner, 0);
        const { img } = layers.get(el);
        const zoom = 1 + Math.abs(amp) / 100 * 2;
        window.gsap.set(img, { scale: zoom, transformOrigin: "50% 50%" });
        tl.fromTo(
          img,
          { yPercent: -amp, force3D: true },
          { yPercent: amp, ease: "none", force3D: true, duration: 1 },
          0
        );
      });
      if (mouseItems.length && window.matchMedia("(hover: hover)").matches) {
        const movers = mouseItems.map((el) => {
          const { frame } = layers.get(el);
          return {
            strength: num2(el.dataset.heroBgMouse, 0),
            qx: window.gsap.quickTo(frame, "xPercent", { duration: MOUSE_SMOOTH, ease: "power3.out" }),
            qy: window.gsap.quickTo(frame, "yPercent", { duration: MOUSE_SMOOTH, ease: "power3.out" })
          };
        });
        let outside = false;
        const resetMovers = () => {
          movers.forEach((m) => {
            m.qx(0);
            m.qy(0);
          });
        };
        const onMove = (e) => {
          const r = hero.getBoundingClientRect();
          const inside = e.clientY >= r.top && e.clientY <= r.bottom && e.clientX >= r.left && e.clientX <= r.right;
          if (!inside) {
            if (!outside) {
              outside = true;
              resetMovers();
            }
            return;
          }
          outside = false;
          const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
          const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
          movers.forEach((m) => {
            m.qx(nx * m.strength);
            m.qy(ny * m.strength);
          });
        };
        const onLeave = (e) => {
          if (e.relatedTarget) return;
          outside = true;
          resetMovers();
        };
        window.addEventListener("mousemove", onMove, { passive: true });
        document.addEventListener("mouseout", onLeave);
        return () => {
          window.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseout", onLeave);
          resetMovers();
        };
      }
    });
  }

  // src/animate/stack-cards.js
  var DEFAULT_STEP = 0.05;
  var DEFAULT_BRIGHTNESS = 0.8;
  var DEFAULT_START2 = "top bottom";
  function num3(value, fallback) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  }
  function initStackCards(root = document) {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lists = root.querySelectorAll(".section_stack-list");
    if (!lists.length) return;
    const mm = window.gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      lists.forEach((list) => {
        const d = list.dataset;
        const step = num3(d.stackStep, DEFAULT_STEP);
        const brightness = num3(d.stackBrightness, DEFAULT_BRIGHTNESS);
        const items = Array.from(list.querySelectorAll(":scope > .stack-item"));
        window.gsap.set(items, { transformOrigin: "50% 0", force3D: true });
        items.forEach((item, i) => {
          for (let j = i + 1; j < items.length; j++) {
            const depth = j - i;
            const fromScale = 1 - (depth - 1) * step;
            const toScale = 1 - depth * step;
            const fromB = 1 - (1 - brightness) * (depth - 1);
            const toB = 1 - (1 - brightness) * depth;
            window.gsap.fromTo(
              item,
              { scale: fromScale, filter: `brightness(${fromB})` },
              {
                scale: toScale,
                filter: `brightness(${toB})`,
                ease: "none",
                immediateRender: false,
                scrollTrigger: {
                  trigger: items[j],
                  start: d.stackStart || DEFAULT_START2,
                  // fin = quand la card j atteint son propre top sticky
                  end: d.stackEnd || (() => {
                    const top = parseFloat(getComputedStyle(items[j]).top) || 0;
                    return `top ${top}px`;
                  }),
                  scrub: true,
                  invalidateOnRefresh: true
                }
              }
            );
          }
        });
      });
      const refresh = () => window.ScrollTrigger.refresh();
      const mo = new MutationObserver(refresh);
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      window.addEventListener("resize", refresh);
      window.addEventListener("load", refresh, { once: true });
      return () => {
        mo.disconnect();
        window.removeEventListener("resize", refresh);
      };
    });
  }

  // src/speakers-slot.js
  var TAG = /\[\s*speakers_list\s*\/?\s*\]/i;
  var clean = (s) => s.replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ");
  function findTagNode() {
    const root = document.querySelector(".w-richtext");
    if (!root) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (TAG.test(clean(walker.currentNode.nodeValue))) return walker.currentNode;
    }
    return null;
  }
  function revealRowByRow(section) {
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) return;
    const items = section.querySelectorAll(".speakers_item");
    if (!items.length) return;
    gsap.set(items, { opacity: 0, y: 24 });
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08
      })
    });
  }
  function initSpeakersSlot() {
    const section = document.querySelector(".section_event_speakers");
    if (!section) return;
    const textNode = findTagNode();
    if (!textNode) {
      section.remove();
      return;
    }
    const block = textNode.parentElement.closest("p, li, div");
    const onlyTag = block && !block.classList.contains("w-richtext") && block.textContent.replace(TAG, "").trim() === "";
    if (onlyTag) {
      block.replaceWith(section);
    } else {
      textNode.nodeValue = clean(textNode.nodeValue).replace(TAG, "");
      textNode.after(section);
    }
    section.classList.add("is-placed");
    revealRowByRow(section);
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  }

  // src/nav-dropdown-hover.js
  function initNavDropdownHover() {
    const CLOSE_DELAY = 200;
    const mq = window.matchMedia("(hover: hover) and (min-width: 992px)");
    const nav = document.querySelector(".nav_fixed");
    const dropdowns = document.querySelectorAll(".nav_fixed .w-dropdown");
    if (!nav || !dropdowns.length) return;
    setupDesktopMenuReset(nav);
    setupScrollLock(nav);
    setupFirstLinkAlignment(nav, dropdowns);
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
        true
      );
      mq.addEventListener("change", () => {
        clearTimeout(closeTimer);
        if (isOpen()) setOpen(false);
      });
    });
  }
  function setupDesktopMenuReset(nav) {
    const desktop = window.matchMedia("(min-width: 992px)");
    const menu = nav.querySelector(".navbar_menu");
    if (!menu) return;
    function reset() {
      if (!desktop.matches) return;
      if (menu.style.transform) menu.style.removeProperty("transform");
      if (menu.style.transition) menu.style.removeProperty("transition");
    }
    new MutationObserver(reset).observe(menu, {
      attributes: true,
      attributeFilter: ["style"]
    });
    desktop.addEventListener("change", reset);
    reset();
  }
  function setupScrollLock(nav) {
    const root = document.documentElement;
    const mobile = window.matchMedia("(max-width: 991px)");
    let locked = false;
    function lock() {
      var _a;
      if (locked) return;
      locked = true;
      root.style.scrollbarGutter = "stable";
      root.style.overflow = "hidden";
      (_a = getLenis()) == null ? void 0 : _a.stop();
    }
    function unlock() {
      var _a;
      if (!locked) return;
      locked = false;
      root.style.overflow = "";
      root.style.scrollbarGutter = "";
      (_a = getLenis()) == null ? void 0 : _a.start();
    }
    function sync() {
      const selector = mobile.matches ? ".navbar_menu-button.w--open, .w-dropdown-toggle.w--open" : ".w-dropdown-toggle.w--open";
      if (nav.querySelector(selector)) lock();
      else unlock();
    }
    new MutationObserver(sync).observe(nav, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
    mobile.addEventListener("change", sync);
    sync();
  }
  function setupFirstLinkAlignment(nav, dropdowns) {
    const desktop = window.matchMedia("(min-width: 992px)");
    const firstLink = nav.querySelector(".navbar_menu .navbar_link");
    if (!firstLink) return;
    const contentLeft = (el) => {
      const cs = getComputedStyle(el);
      return el.getBoundingClientRect().left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0);
    };
    function align(dropdown) {
      const toggle = dropdown.querySelector(".w-dropdown-toggle");
      const list = dropdown.querySelector(".w-dropdown-list");
      const container = list == null ? void 0 : list.querySelector(".dropdown-container");
      if (!toggle || !container) return;
      if (!desktop.matches) {
        container.style.removeProperty("padding-left");
        return;
      }
      if (!toggle.classList.contains("w--open")) return;
      const column = container.querySelector(".dropdown-list-wrapper");
      if (!column) return;
      const setPadding = (px) => container.style.setProperty("padding-left", `${px}px`, "important");
      const target = contentLeft(firstLink);
      setPadding(0);
      const at0 = contentLeft(column);
      setPadding(100);
      const at100 = contentLeft(column);
      const slope = (at100 - at0) / 100;
      if (Math.abs(slope) < 0.05) {
        container.style.removeProperty("padding-left");
        return;
      }
      let value = Math.max(0, (target - at0) / slope);
      setPadding(value);
      const error = target - contentLeft(column);
      if (Math.abs(error) > 0.5) value = Math.max(0, value + error / slope);
      setPadding(Math.round(value * 100) / 100);
    }
    function alignAll() {
      dropdowns.forEach(align);
    }
    new MutationObserver(alignAll).observe(nav, {
      subtree: true,
      attributes: true,
      attributeFilter: ["class"]
    });
    window.addEventListener("resize", alignAll, { passive: true });
    desktop.addEventListener("change", alignAll);
    alignAll();
  }

  // src/index.js
  var BUILD_VERSION = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  console.log(`%c[RockFi] main.js \u2014 build v1.0.2 ${BUILD_VERSION}`, "color:#7dd3fc");
  onReady(() => {
    init();
    initSpeakersSlot();
    initCollapses();
    initBlogAccordion();
    initBlogFaq();
    initShareToast();
    initEmbeds();
    init2();
    initAnimations();
    initSchema();
    initSvgTrace();
    initParallax();
    initHeroParallax();
    initListLenisSync();
    initFocusStories();
    initVideoSection();
    initDotArrow();
    initTagReveal();
    initNameTokens();
    initNavHero();
    initHeroBgParallax();
    initStackCards();
    initNavDropdownHover();
  });
})();
//# sourceMappingURL=main.js.map
