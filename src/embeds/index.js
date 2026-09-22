// src/embeds/index.js
import { initTableEnhance } from "./table-enhance.js";
import { initButtonEnhance } from "./button-enhance.js";
import { initListEnhance } from "./list-enhance.js";
import { initCalcEnhance } from "./calc-enhance.js";
import { initQuoteLargeEnhance } from "./quote-large-enhance.js";
import { initQuoteEnhance } from "./quote-enhance.js";
import { initSliderEnhance } from "./slider-enhance.js";
import { initVideoEnhance } from "./video-enhance.js";

export function initEmbeds(root = document) {
  initTableEnhance(root);
  initButtonEnhance(root);
  initListEnhance(root);
  initCalcEnhance(root);
  initQuoteLargeEnhance(root);
  initQuoteEnhance(root);
  initSliderEnhance(root);
  initVideoEnhance(root);
}