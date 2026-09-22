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
  function initLenis() {
    if (typeof window.Lenis === "undefined") return null;
    if (prefersReducedMotion()) return null;
    lenisInstance = new window.Lenis({
      duration: 1.2,
      smoothWheel: true
    });
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return lenisInstance;
  }
  function init() {
    initLenis();
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
  function initTagReveal() {
    const tags = document.querySelectorAll(".tag");
    if (!tags.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    tags.forEach((tag) => observer.observe(tag));
  }

  // src/blog-toc-responsive.js
  function toggleDesktopTocAttrs() {
    const DESKTOP_MIN = 992;
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
  function init2() {
    toggleDesktopTocAttrs();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(toggleDesktopTocAttrs, 150);
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

  // src/embeds/table-enhance.js
  var TABLE_BLOCK_REGEX = /(?:<p>)?\[table(\s+split)?\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/table\](?:<\/p>)?/gi;
  function cleanRow(line) {
    return line.split(",").map((cell) => cell.trim());
  }
  function initTableEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!TABLE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    TABLE_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(
      TABLE_BLOCK_REGEX,
      (match, splitFlag, body) => {
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
        <div class="rt-table-wrap rf-wrap">
          <table class="rt-table${useSplit ? " rt-table--split" : ""}">
            <thead>${theadHTML}</thead>
            <tbody>${tbodyHTML}</tbody>
          </table>
        </div>
      `;
      }
    );
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
    const raw = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-1.69982" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_0_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="2.07751" cy="2.08166" r="1.31507" transform="rotate(-180 2.07751 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="-0.110111" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_1_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="2.08166" r="1.31507" transform="rotate(-180 8.00524 2.08166)" fill="white"/>
<foreignObject x="10.142" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_2_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="13.9193" cy="2.08166" r="1.31507" transform="rotate(-180 13.9193 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="-0.114994" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_3_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="2.07751" cy="7.99841" r="1.31507" transform="rotate(-180 2.07751 7.99841)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_4_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="7.99841" r="1.31507" transform="rotate(-180 8.00524 7.99841)" fill="white" fill-opacity="0.1"/>
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
  function initButtonEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!BUTTON_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    BUTTON_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(
      BUTTON_BLOCK_REGEX,
      (match, attrString, body) => {
        const attrs = parseAttrs(attrString);
        const href = attrs.href || "#";
        const label = body.replace(/<[^>]+>/g, "").trim();
        if (!label) return match;
        const showIcon = attrs.icon !== "false";
        buttonInstanceCounter += 1;
        const iconHTML = showIcon ? `<div class="rt-button-icon">${buildIconSVG(`rtbtn${buttonInstanceCounter}`)}</div>` : "";
        return `<div class="rf-wrap"><a href="${href}" class="rt-button">${iconHTML}<div>${label}</div></a></div>`;
      }
    );
  }

  // src/embeds/list-enhance.js
  var LIST_BLOCK_REGEX = /(?:<p>)?\[list\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/list\](?:<\/p>)?/gi;
  var BOLD_REGEX = /\[b\](.*?)\[\/b\]/gi;
  function applyBold(text) {
    return text.replace(BOLD_REGEX, '<strong class="rt-bold">$1</strong>');
  }
  function initListEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!LIST_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    LIST_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(LIST_BLOCK_REGEX, (match, body) => {
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
      return `<div class="rf-wrap"><ul class="rt-list rt-text" role="list">${itemsHTML}</ul></div>`;
    });
  }

  // src/embeds/calc-enhance.js
  var CALC_BLOCK_REGEX = /(?:<p>)?\[calc\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/calc\](?:<\/p>)?/gi;
  function initCalcEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!CALC_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    CALC_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(CALC_BLOCK_REGEX, (match, body) => {
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
      <div class="rf-wrap">
        <div class="rt-calc">
          ${blocksHTML}
          ${footerHTML}
        </div>
      </div>
    `;
    });
  }

  // src/embeds/quote-large-enhance.js
  var QUOTE_LARGE_BLOCK_REGEX = /(?:<p>)?\[quote-large\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote-large\](?:<\/p>)?/gi;
  function initQuoteLargeEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!QUOTE_LARGE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    QUOTE_LARGE_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(QUOTE_LARGE_BLOCK_REGEX, (match, body) => {
      const text = body.replace(/<\/p>|<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").trim();
      if (!text) return match;
      return `
      <div class="rf-wrap">
        <blockquote class="rt-quote-large">&ldquo;${text}&rdquo;</blockquote>
      </div>
    `;
    });
  }

  // src/embeds/quote-enhance.js
  var QUOTE_BLOCK_REGEX = /(?:<p>)?\[quote(?=[\s\]])([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote\](?:<\/p>)?/gi;
  function initQuoteEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!QUOTE_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    QUOTE_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(
      QUOTE_BLOCK_REGEX,
      (match, attrString, body) => {
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
        <div class="rf-wrap">
          <div class="rt-quote">
            <p class="rt-quote-text">&ldquo;${text}&rdquo;</p>
            ${authorHTML}
          </div>
        </div>
      `;
      }
    );
  }

  // src/embeds/slider-enhance.js
  var SLIDER_BLOCK_REGEX = /(?:<p>)?\[slider\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/slider\](?:<\/p>)?/gi;
  var CHEVRON_SVG = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.00003 4L10 8L6 12" stroke="#1A1A1A" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function buildSlidesHTML(body) {
    const lines = body.replace(/<\/p>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").split("\n").map((line) => line.trim()).filter(Boolean);
    return lines.map((line) => {
      const parts = line.split("|").map((s) => s.trim());
      const url = parts[0];
      const caption = parts[1] || "";
      if (!url) return "";
      const captionHTML = caption ? `<figcaption class="rt-slider-caption">${caption}</figcaption>` : "";
      return `
        <div class="rt-slider-item">
          <img src="${url}" alt="${caption}" loading="lazy" draggable="false">
          ${captionHTML}
        </div>
      `;
    }).join("");
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
  function initSliderEnhance(root = document) {
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
          <button type="button" class="rt-slider-prev" aria-label="Image pr\xE9c\xE9dente">${CHEVRON_SVG}</button>
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

  // src/embeds/video-enhance.js
  var VIDEO_BLOCK_REGEX = /(?:<p>)?\[video([^\]]*)\](?:<\/p>)?/gi;
  function getVideoInfo(src) {
    const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    if (ytMatch) return { type: "youtube", id: ytMatch[1] };
    const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return { type: "vimeo", id: vimeoMatch[1] };
    return { type: "native", id: null };
  }
  function buildPlayerMarkup(src, poster) {
    const info = getVideoInfo(src);
    if (info.type === "youtube") {
      return `<div class="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${info.id}"></div>`;
    }
    if (info.type === "vimeo") {
      return `<div class="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id="${info.id}"></div>`;
    }
    const posterAttr = poster ? ` poster="${poster}"` : "";
    return `<video playsinline${posterAttr}><source src="${src}" type="video/mp4"></video>`;
  }
  function buildGlassIconSVG(idSuffix) {
    const raw = `<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  function initVideoEnhance(root = document) {
    const contentEl = root.querySelector(".rich-text_blog");
    if (!contentEl) return;
    if (!VIDEO_BLOCK_REGEX.test(contentEl.innerHTML)) return;
    VIDEO_BLOCK_REGEX.lastIndex = 0;
    contentEl.innerHTML = contentEl.innerHTML.replace(VIDEO_BLOCK_REGEX, (match, attrString) => {
      const attrs = parseAttrs(attrString);
      const src = attrs.src || "";
      const poster = attrs.poster || "";
      if (!src) return match;
      videoInstanceCounter += 1;
      const iconSVG = buildGlassIconSVG(`rtvid${videoInstanceCounter}`);
      return `
      <div class="rt-video">
        <div class="rt-video-player">${buildPlayerMarkup(src, poster)}</div>
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
    contentEl.querySelectorAll(".rt-video:not([data-video-initialized])").forEach((el) => {
      el.setAttribute("data-video-initialized", "true");
      if (typeof window.Plyr === "undefined") return;
      const target = el.querySelector(".rt-video-player").firstElementChild;
      const player = new window.Plyr(target, {
        controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"]
      });
      const glassBtn = el.querySelector(".rt-video-play-glass");
      const durationEl = el.querySelector(".rt-video-cta-duration");
      glassBtn.addEventListener("click", () => player.play());
      player.on("play", () => el.classList.add("is-playing"));
      player.on("pause", () => el.classList.remove("is-playing"));
      player.on("loadedmetadata", () => {
        const formatted = formatDuration(player.duration);
        if (formatted) durationEl.textContent = formatted;
      });
    });
  }

  // src/embeds/index.js
  function initEmbeds(root = document) {
    initTableEnhance(root);
    initButtonEnhance(root);
    initListEnhance(root);
    initCalcEnhance(root);
    initQuoteLargeEnhance(root);
    initQuoteEnhance(root);
    initSliderEnhance(root);
    initVideoEnhance(root);
  }

  // src/index.js
  var BUILD_VERSION = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  console.log(`%c[RockFi] main.js \u2014 build v1.0.0 ${BUILD_VERSION}`, "color:#7dd3fc");
  onReady(() => {
    init();
    initCollapses();
    initTagReveal();
    init2();
    initBlogAccordion();
    initShareToast();
    initEmbeds();
  });
})();
//# sourceMappingURL=main.js.map
