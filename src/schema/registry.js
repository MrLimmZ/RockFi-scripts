// src/schema/registry.js

import {
  buildArticleSchema,
  buildLandingSchema,
} from "./builders.js";
import { pathnameStartsWith } from "./utils.js";

export const PAGE_BUILDERS = [
  { 
    test: () => pathnameStartsWith("/blog-post/") || pathnameStartsWith("/landing-posts/"), 
    build: buildArticleSchema 
  },
];