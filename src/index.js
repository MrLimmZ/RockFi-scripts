import { onReady } from "./utils/on-ready.js";

import { init as initCore } from "./core.js";
import { initCollapses } from "./collapse.js";
import { initTagReveal } from "./tag-reveal.js";
import { init as initBlogToc } from "./blog-toc-responsive.js";
import { initBlogAccordion } from "./blog-accordion.js";
import { initShareToast } from "./share-toast.js";
import { initEmbeds } from "./embeds/index.js";

const BUILD_VERSION = new Date().toISOString().slice(0, 10);
console.log(`%c[RockFi] main.js — build v1.0.0 ${BUILD_VERSION}`, "color:#7dd3fc");

onReady(() => {
  initCore();
  initCollapses();
  initTagReveal();
  initBlogToc();
  initBlogAccordion();
  initShareToast();
  initEmbeds();
});