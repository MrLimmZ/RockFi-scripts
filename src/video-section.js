// src/video-section.js
// Rend fonctionnelle la section vidéo (keynote, événement...).
//
// HTML attendu (déjà en place dans Webflow) :
//   .video_media[data-video-player="URL"]   conteneur + URL (mp4, YouTube, Vimeo)
//     img[data-video-poster]                affiche
//   .video_controller[data-video-play]      bouton "Voir la vidéo" (icône + texte + durée)
//     [data-video-timer]                    durée affichée
//
// Seul le bouton (.video_controller) lance la vidéo, pas l'affiche.
//
// Options (data-attributes sur .video_media, facultatives) :
//   data-video-captions="URL.vtt"   sous-titres
//   data-video-title="Titre"        titre accessible
//   data-video-duration="2:30"      durée de secours (YouTube surtout)
//   data-video-magnet="0.35"        force de l'effet magnétique (0 = désactivé)
//
// Durée : mp4 via métadonnées, Vimeo via oEmbed, sinon data-video-duration
// ou lecture Plyr au premier clic.

const PLYR_I18N_FR = {
  play: "Lire",
  pause: "Pause",
  mute: "Couper le son",
  unmute: "Activer le son",
  enableCaptions: "Activer les sous-titres",
  disableCaptions: "Désactiver les sous-titres",
  enterFullscreen: "Plein écran",
  exitFullscreen: "Quitter le plein écran",
};

function getVideoInfo(src) {
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return { type: "youtube", id: yt[1] };

  const vimeo = src.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { type: "vimeo", id: vimeo[1] };

  return { type: "native", id: null };
}

function buildPlayerMarkup(src, captions, title) {
  const info = getVideoInfo(src);
  const frameTitle = title || "Lecteur vidéo";

  if (info.type === "youtube" || info.type === "vimeo") {
    return `<div class="plyr__video-embed" data-plyr-provider="${info.type}" data-plyr-embed-id="${info.id}" title="${frameTitle}"></div>`;
  }

  const track = captions
    ? `<track kind="captions" label="Français" srclang="fr" src="${captions}" default>`
    : "";

  return `<video playsinline preload="metadata"><source src="${src}" type="video/mp4">${track}</video>`;
}

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return "";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
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

  // On vide le texte de démo : seule une vraie durée sera affichée
  timerEl.textContent = "";
  if (fallback) setTimer(timerEl, fallback);

  const info = getVideoInfo(src);

  if (info.type === "native") {
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.muted = true;
    probe.playsInline = true;

    const done = () => {
      setTimer(timerEl, formatDuration(probe.duration));
      probe.removeAttribute("src");
      probe.load();
    };
    probe.addEventListener("loadedmetadata", done, { once: true });
    probe.addEventListener("error", () => {}, { once: true });

    probe.src = src;
    probe.load();
    return;
  }

  if (info.type === "vimeo" && typeof fetch === "function") {
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(src)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.duration) setTimer(timerEl, formatDuration(d.duration));
      })
      .catch(() => {});
  }
}

// Effet magnétique : le bouton suit légèrement la souris à l'approche.
// Utilise la propriété CSS `translate` (variables --mx / --my), indépendante
// de `transform` utilisé par l'animation d'apparition.
function initMagnet(layout, button, strength) {
  if (!button || !strength) return;
  if (window.matchMedia && (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    return;
  }

  const RADIUS = 160; // distance d'influence autour du bouton, en px
  const MAX = 14; // déplacement maximum, en px
  const EASE = 0.14; // lissage (0 = figé, 1 = instantané)

  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = null;

  function render() {
    cx += (tx - cx) * EASE;
    cy += (ty - cy) * EASE;
    button.style.setProperty("--mx", `${cx.toFixed(2)}px`);
    button.style.setProperty("--my", `${cy.toFixed(2)}px`);

    const settled = Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05;
    raf = settled ? null : requestAnimationFrame(render);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(render);
  }

  function onMove(ev) {
    const rect = button.getBoundingClientRect();
    // Centre "au repos" : on retire le décalage magnétique en cours
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

  layout.addEventListener("mousemove", onMove);
  layout.addEventListener("mouseleave", reset);
}

function initOne(media) {
  const src = media.dataset.videoPlayer;
  if (!src) return;

  const layout = media.closest(".video_layout") || media.parentElement;
  const trigger = layout.querySelector("[data-video-play]");
  const timerEl = layout.querySelector("[data-video-timer]");
  const captions = media.dataset.videoCaptions || "";
  const title = media.dataset.videoTitle || "";
  const magnet = media.dataset.videoMagnet !== undefined ? parseFloat(media.dataset.videoMagnet) : 0.35;

  loadDuration(src, timerEl, media.dataset.videoDuration);
  initMagnet(layout, trigger, magnet);

  let started = false;

  function start() {
    if (started) return;
    started = true;
    layout.classList.add("is-playing");

    const holder = document.createElement("div");
    holder.className = "video_player-holder";
    holder.innerHTML = buildPlayerMarkup(src, captions, title);
    media.appendChild(holder);

    const target = holder.firstElementChild;

    // Plyr indisponible : lecteur natif
    if (typeof window.Plyr === "undefined") {
      if (target.tagName === "VIDEO") {
        target.controls = true;
        target.play().catch(() => {});
      }
      return;
    }

    const hasCaptions = Boolean(holder.querySelector("track"));
    const player = new window.Plyr(target, {
      controls: ["play", "progress", "current-time", "mute", "volume", ...(hasCaptions ? ["captions"] : []), "fullscreen"],
      i18n: PLYR_I18N_FR,
    });

    if (getVideoInfo(src).type === "native") player.play();
    else player.once("ready", () => player.play());

    player.on("loadedmetadata", () => {
      setTimer(timerEl, formatDuration(player.duration));
    });
  }

  // Seul le bouton (icône + texte + durée) lance la vidéo, pas l'affiche
  if (trigger) {
    trigger.addEventListener("click", start);
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Voir la vidéo");
    trigger.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        start();
      }
    });
  }
}

export function initVideoSection(root = document) {
  root.querySelectorAll("[data-video-player]:not([data-video-ready])").forEach((media) => {
    media.setAttribute("data-video-ready", "true");
    initOne(media);
  });
}