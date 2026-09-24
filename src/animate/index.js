// src/animate/index.js
import { prefersReducedMotion } from "../utils/motion-preference.js";
import { setupGsap } from "./setup.js";
import { scanAnimations } from "./scan.js";

export function initAnimations(root = document) {
  if (prefersReducedMotion()) return; // pas d'animation, contenu visible tel quel par défaut (opacity:1 non touché)

  setupGsap();
  scanAnimations(root);
}