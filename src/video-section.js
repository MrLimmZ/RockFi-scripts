// src/video-section.js
// Rend fonctionnelle la section vidéo (keynote, événement...) ET les cartes
// personas (une vidéo par carte).
//
// 1) SECTION :
//   .video_media[data-video-player="URL"]   conteneur + URL (mp4, YouTube, Vimeo)
//     img[data-video-poster]                affiche
//   .video_controller[data-video-play]      bouton "Voir la vidéo"
//     .video_controller-play                icône ronde (ancre du magnétisme)
//     [data-video-timer]                    durée affichée
//
// 2) CARTES PERSONAS :
//   .personas_card[data-video-card][data-video-player="URL"]
//     .personas_card-banner[data-video-magnet-zone]   accueille le lecteur + zone magnétique
//       .video_controller                   bouton
//         .video_controller-play            icône ronde (ancre du magnétisme)
//         .video_controller-time            durée affichée
//
// Un seul lecteur actif à la fois : en lancer un remet les autres sur leur poster.
//
// Options (data-attributes, facultatives) :
//   data-video-captions="URL.vtt"   sous-titres
//   data-video-title="Titre"        titre accessible
//   data-video-duration="2:30"      durée de secours (YouTube surtout)
//   data-video-magnet="0.35"        force de l'effet magnétique (0 = désactivé)
//   data-video-magnet-zone          (sur un élément enfant) limite la zone où la
//                                   souris déclenche le magnétisme ; sinon tout le root

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

const DEFAULT_MAGNET = 0.35;

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

// Effet magnétique :
//   scope  : zone où la souris déclenche l'effet
//   mover  : élément qui se déplace (tout le groupe .video_controller)
//   anchor : élément de référence pour la distance (.video_controller-play)
// Utilise la propriété CSS `translate` (variables --mx / --my posées sur mover),
// indépendante de `transform` utilisé par l'animation d'apparition.
function initMagnet(scope, mover, anchor, strength) {
  if (!scope || !mover || !anchor || !strength) return;
  if (
    window.matchMedia &&
    (window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  ) {
    return;
  }

  const RADIUS = 160; // distance d'influence autour de l'icône, en px
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
    mover.style.setProperty("--mx", `${cx.toFixed(2)}px`);
    mover.style.setProperty("--my", `${cy.toFixed(2)}px`);

    const settled = Math.abs(tx - cx) < 0.05 && Math.abs(ty - cy) < 0.05;
    raf = settled ? null : requestAnimationFrame(render);
  }

  function kick() {
    if (!raf) raf = requestAnimationFrame(render);
  }

  function onMove(ev) {
    // L'icône bouge avec le groupe : on retire le décalage en cours
    // pour obtenir son centre "au repos"
    const rect = anchor.getBoundingClientRect();
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

  scope.addEventListener("mousemove", onMove);
  scope.addEventListener("mouseleave", reset);
}

// ---------------------------------------------------------------------------
// Lecteur unique : un seul actif à la fois
// ---------------------------------------------------------------------------
let activeStop = null;

function claimPlayback(stop) {
  if (activeStop && activeStop !== stop) activeStop();
  activeStop = stop;
}

// ---------------------------------------------------------------------------
// Logique commune section + cartes
//   root    : élément qui porte la classe is-playing
//   host    : élément dans lequel le lecteur est inséré (au-dessus du poster)
//   trigger : bouton (groupe) qui lance la vidéo et qui bouge au magnétisme
// ---------------------------------------------------------------------------
function setupPlayback({ root, host, trigger, timerEl, src, captions, title, duration, magnet }) {
  loadDuration(src, timerEl, duration);

  // Tout le groupe bouge, mais la réaction part de l'icône ronde,
  // et uniquement quand la souris est dans la zone définie
  const playBtn = trigger && trigger.querySelector(".video_controller-play");
  const magnetScope = root.querySelector("[data-video-magnet-zone]") || root;
  initMagnet(magnetScope, trigger, playBtn, magnet);

  let holder = null;
  let player = null;

  // Remet le poster : détruit le lecteur, retire le conteneur, réaffiche le bouton
  function stop() {
    if (player) {
      try {
        player.pause();
        player.destroy();
      } catch (e) {}
      player = null;
    }
    if (holder) {
      holder.remove();
      holder = null;
    }
    root.classList.remove("is-playing");
    if (activeStop === stop) activeStop = null;
  }

  function start(e) {
    if (e) e.stopPropagation();
    if (holder) return; // déjà en lecture

    claimPlayback(stop);
    root.classList.add("is-playing");

    holder = document.createElement("div");
    holder.className = "video_player-holder swiper-no-swiping";
    holder.innerHTML = buildPlayerMarkup(src, captions, title);
    host.appendChild(holder);

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
    player = new window.Plyr(target, {
      controls: [
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        ...(hasCaptions ? ["captions"] : []),
        "fullscreen",
      ],
      i18n: PLYR_I18N_FR,
    });

    if (getVideoInfo(src).type === "native") player.play();
    else player.once("ready", () => player.play());

    player.on("loadedmetadata", () => setTimer(timerEl, formatDuration(player.duration)));
  }

  if (trigger) {
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Voir la vidéo");
    trigger.addEventListener("click", start);
    trigger.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        start(ev);
      }
    });
  }
}

function readMagnet(el) {
  return el.dataset.videoMagnet !== undefined ? parseFloat(el.dataset.videoMagnet) : DEFAULT_MAGNET;
}

// Section principale
function initOne(media) {
  const src = media.dataset.videoPlayer;
  if (!src) return;

  const layout = media.closest(".video_layout") || media.parentElement;

  setupPlayback({
    root: layout,
    host: media,
    trigger: layout.querySelector("[data-video-play]"),
    timerEl: layout.querySelector("[data-video-timer]"),
    src,
    captions: media.dataset.videoCaptions || "",
    title: media.dataset.videoTitle || "",
    duration: media.dataset.videoDuration,
    magnet: readMagnet(media),
  });
}

// Cartes personas
function initCard(card) {
  const src = card.dataset.videoPlayer;
  if (!src) return;

  setupPlayback({
    root: card,
    host: card.querySelector(".personas_card-banner") || card,
    trigger: card.querySelector(".video_controller"),
    timerEl: card.querySelector(".video_controller-time"),
    src,
    captions: card.dataset.videoCaptions || "",
    title: card.dataset.videoTitle || "",
    duration: card.dataset.videoDuration,
    magnet: readMagnet(card),
  });
}

export function initVideoSection(root = document) {
  // Section principale (les cartes sont exclues)
  root
    .querySelectorAll("[data-video-player]:not([data-video-ready]):not([data-video-card])")
    .forEach((media) => {
      media.setAttribute("data-video-ready", "true");
      initOne(media);
    });

  // Cartes personas
  root.querySelectorAll("[data-video-card]:not([data-video-ready])").forEach((card) => {
    card.setAttribute("data-video-ready", "true");
    initCard(card);
  });
}