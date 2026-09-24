import { onReady } from "./utils/on-ready.js";

import { init as initCore } from "./core.js";
import { initCollapses } from "./collapse.js";
import { initTagReveal } from "./tag-reveal.js";
import { initBlogAccordion } from "./blog-accordion.js";
import { initShareToast } from "./share-toast.js";
import { init as initBlogToc } from "./blog-toc.js";
import { initEmbeds } from "./embeds/index.js";
import { initBlogFaq } from "./blog-faq.js";
import { initSchema } from "./schema/index.js";
import { initAnimations } from "./animate/index.js";
import { initSvgTrace } from "./animate/svg-trace.js";
import { initDotArrow } from "./animate/dot-arrow.js";
import { initParallax } from "./animate/parallax.js";
import { initListLenisSync } from "./list-lenis-sync.js";

const BUILD_VERSION = new Date().toISOString().slice(0, 10);
console.log(`%c[RockFi] main.js — build v1.0.1 ${BUILD_VERSION}`, "color:#7dd3fc");

onReady(() => {
  initCore();
  initCollapses();
  initTagReveal();
  initBlogAccordion();
  initBlogFaq();
  initShareToast();
  initEmbeds();
  initBlogToc();
  initAnimations();
  initSchema();
  initSvgTrace();
  initDotArrow();
  initParallax();
  initListLenisSync();
});