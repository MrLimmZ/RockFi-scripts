// src/tag-reveal.js
const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_STAGGER = 0.12;
const MAX_DELAY = 3;

function createFadeGradient(svg, color) {
  const gradientId = `tag-trace-${Math.random().toString(36).slice(2, 9)}`;
  const gradient = document.createElementNS(SVG_NS, "linearGradient");
  gradient.setAttribute("id", gradientId);
  gradient.setAttribute("gradientUnits", "userSpaceOnUse");

  [
    { offset: "0", opacity: "0" },
    { offset: "0.55", opacity: "0.5" },
    { offset: "0.85", opacity: "1" },
    { offset: "1", opacity: "0" },
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
    const p1 = rect.getPointAtLength(((start % totalLength) + totalLength) % totalLength);
    const p2 = rect.getPointAtLength((((start + length) % totalLength) + totalLength) % totalLength);
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
    },
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
    },
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
    },
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
      onUpdate: () => setIntensity(fx.i),
    },
    peakTime,
  );

  tl.call(() => svg.remove());
}

function initTagReveal(root = document) {
  if (typeof window.gsap === "undefined") return;

  const observed = new WeakSet();
  let queueIndex = 0;
  let resetTimer = null;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => {
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
    { threshold: 0.1 },
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
    subtree: true,
  });
}

export { initTagReveal };