// src/schema/index.js
import { PAGE_BUILDERS } from "./registry.js";
import { injectGraph } from "./utils.js";

export function initSchema(root = document) {
  const graph = PAGE_BUILDERS.find((entry) => entry.test(root))?.build(root) ?? [];
  injectGraph(graph);
}