import "./core.js";
import "./collapse.js";
// import "./barba.js"; // pas de transitions Barba pour l'instant sur ce projet

const BUILD_VERSION = new Date().toISOString().slice(0, 10);
console.log(`%c[RockFi] main.js — build v1.0.0 ${BUILD_VERSION}`, "color:#7dd3fc");
