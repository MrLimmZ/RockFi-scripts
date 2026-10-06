// src/video-section.js
// Rend fonctionnelle la section vidéo (keynote, événement...) ET les cartes
// (personas, presse...) : une vidéo par carte.
//
// 1) SECTION :
//   .video_media[data-video-player="URL"]   conteneur + URL (mp4, YouTube, Vimeo)
//     img[data-video-poster]                affiche
//   .video_controller[data-video-play]      bouton "Voir la vidéo"
//     .video_controller-play                icône ronde (ancre du magnétisme)
//     [data-video-timer]                    durée affichée
//
// 2) CARTES (personas, presse...) :
//   .personas_card[data-video-card][data-video-player="URL"]
//     .personas_card-banner[data-video-magnet-zone]   accueille le lecteur + zone magnétique
//       .video_controller                   bouton
//         .video_controller-play            icône ronde (ancre du magnétisme)
//         .video_controller-time            durée affichée
//
// Formats acceptés dans data-video-player :
//   https://.../video.mp4                 fichier natif
//   youtube:ID  ou URL YouTube
//   vimeo:ID    vimeo:ID/HASH (non répertoriée)  ou URL Vimeo
//
// Un seul lecteur (avec son) actif à la fois : en lancer un remet les autres
// sur leur aperçu / poster. À la fin d'une vidéo, on revient à l'aperçu ou au
// poster (évite l'écran de fin "autres vidéos" de Vimeo).
//
// Options (data-attributes, facultatives) :
//   data-video-autoplay             aperçu muet en boucle, visible à l'écran ;
//                                   un clic relance la vidéo depuis le début avec
//                                   le lecteur complet. Absent ou "false" = désactivé.
//   data-video-autoplay-start="12"  l'aperçu commence (et reboucle) à 12 s. Défaut : 0.
//   data-video-autoplay-delay="0"   délai (secondes) entre l'arrivée à l'écran et le
//                                   début de l'aperçu. Défaut : 0 (immédiat).
//   data-video-host                 (sur un élément enfant) accueille le lecteur à la
//                                   place de la carte entière ; prioritaire sur le reste
//   data-video-captions="URL.vtt"   sous-titres
//   data-video-title="Titre"        titre accessible
//   data-video-duration="2:30"      durée de secours (YouTube / Vimeo privé)
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
const DEFAULT_AUTOPLAY_DELAY = 0; // secondes (0 = dès que la carte est visible)
const FADE_MS = 350; // doit correspondre à la transition CSS des holders
const REVEAL_TIMEOUT_MS = 4000; // sécurité lecteur classique
const PREVIEW_REVEAL_TIMEOUT_MS = 2500; // sécurité aperçu

function getVideoInfo(src) {
  const s = (src || "").trim();

  // Raccourcis : "youtube:ID" / "vimeo:ID" / "vimeo:ID/HASH" (ou "vimeo:ID:HASH")
  const short = s.match(/^(youtube|vimeo):([\w-]+)(?:[/:]([\w]+))?$/i);
  if (short) {
    const type = short[1].toLowerCase();
    const id = short[2];
    const hash = short[3] || "";
    if (type === "vimeo") {
      return {
        type,
        id,
        hash,
        url: `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`,
      };
    }
    return { type, id, hash: "", url: `https://www.youtube.com/watch?v=${id}` };
  }

  const yt = s.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return { type: "youtube", id: yt[1], hash: "", url: s };

  // URL Vimeo, avec hash optionnel pour les vidéos non répertoriées
  const vimeo = s.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\w]+))?/);
  if (vimeo) {
    return { type: "vimeo", id: vimeo[1], hash: vimeo[2] || "", url: s };
  }

  return { type: "native", id: null, hash: "", url: s };
}

// preview = true : version muette sans sous-titres (aperçu autoplay)
// startAt        : seconde de départ de l'aperçu (fichier natif, via #t=)
function buildPlayerMarkup(src, captions, title, preview = false, startAt = 0) {
  const info = getVideoInfo(src);
  const frameTitle = title || "Lecteur vidéo";

  if (info.type === "youtube" || info.type === "vimeo") {
    // Vimeo avec hash : on passe l'URL complète, Plyr en extrait l'ID et le hash
    const embedId = info.type === "vimeo" && info.hash ? info.url : info.id;
    return `<div class="plyr__video-embed" data-plyr-provider="${info.type}" data-plyr-embed-id="${embedId}" title="${frameTitle}"></div>`;
  }

  if (preview) {
    const frag = startAt > 0 ? `#t=${startAt}` : "";
    return `<video playsinline muted preload="auto"><source src="${info.url}${frag}" type="video/mp4"></video>`;
  }

  const track = captions
    ? `<track kind="captions" label="Français" srclang="fr" src="${captions}" default>`
    : "";

  return `<video playsinline preload="metadata"><source src="${info.url}" type="video/mp4">${track}</video>`;
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

    probe.src = info.url;
    probe.load();
    return;
  }

  if (info.type === "vimeo" && typeof fetch === "function") {
    fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(info.url)}`)
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
// Lecteur unique : un seul actif à la fois (les aperçus muets ne comptent pas)
// ---------------------------------------------------------------------------
let activeStop = null;

function claimPlayback(stop) {
  if (activeStop && activeStop !== stop) activeStop();
  activeStop = stop;
}

// ---------------------------------------------------------------------------
// Logique commune section + cartes
//   root    : élément qui porte les classes is-playing / is-previewing
//   host    : élément dans lequel le lecteur est inséré (au-dessus du poster)
//   trigger : bouton (groupe) qui lance la vidéo et qui bouge au magnétisme
// ---------------------------------------------------------------------------
function setupPlayback({
  root,
  host,
  trigger,
  timerEl,
  src,
  captions,
  title,
  duration,
  magnet,
  autoplay,
  autoplayDelay,
  autoplayStart,
}) {
  loadDuration(src, timerEl, duration);

  // Tout le groupe bouge, mais la réaction part de l'icône ronde,
  // et uniquement quand la souris est dans la zone définie
  const playBtn = trigger && trigger.querySelector(".video_controller-play");
  const magnetScope = root.querySelector("[data-video-magnet-zone]") || root;
  initMagnet(magnetScope, trigger, playBtn, magnet);

  let holder = null;
  let player = null;
  let revealTimer = null;
  let cleanupTimer = null;

  // Aperçu muet (autoplay)
  let previewHolder = null;
  let previewPlayer = null;
  let previewTimer = null;
  let previewRevealTimer = null;
  let previewPaused = false;
  let inView = true;

  const isNative = getVideoInfo(src).type === "native";

  // Un clic dans le lecteur ne doit jamais suivre le lien parent.
  // preventDefault seulement : Plyr doit continuer à recevoir ses clics.
  function blockLink(ev) {
    if (holder && holder.contains(ev.target)) ev.preventDefault();
  }

  // ---- Aperçu muet ----
  function clearPreviewTimer() {
    if (previewTimer) {
      clearTimeout(previewTimer);
      previewTimer = null;
    }
  }

  // Détruit vraiment l'aperçu (lecteur classique prêt, ou fin de vie)
  function stopPreview() {
    clearPreviewTimer();
    clearTimeout(previewRevealTimer);
    previewRevealTimer = null;
    if (previewPlayer) {
      try {
        previewPlayer.destroy();
      } catch (e) {}
      previewPlayer = null;
    }
    if (previewHolder) {
      previewHolder.remove();
      previewHolder = null;
    }
    previewPaused = false;
    root.classList.remove("is-previewing");
  }

  // Met l'aperçu en pause (hors écran) sans le détruire : pas de rechargement
  function pausePreview() {
    clearPreviewTimer();
    if (!previewHolder || previewPaused) return;
    previewPaused = true;
    try {
      if (previewPlayer) previewPlayer.pause();
      else {
        const v = previewHolder.querySelector("video");
        if (v) v.pause();
      }
    } catch (e) {}
  }

  function resumePreview() {
    if (!previewHolder || !previewPaused) return;
    previewPaused = false;
    try {
      const p = previewPlayer
        ? previewPlayer.play()
        : previewHolder.querySelector("video")?.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    } catch (e) {}
  }

  function startPreview() {
    if (previewHolder || holder) return;

    previewHolder = document.createElement("div");
    // Invisible (opacity 0 en CSS) jusqu'à ce que la lecture démarre vraiment
    previewHolder.className = "video_preview-holder swiper-no-swiping";
    previewHolder.setAttribute("aria-hidden", "true");
    previewHolder.innerHTML = buildPlayerMarkup(src, "", title, true, autoplayStart);
    host.appendChild(previewHolder);

    const ph = previewHolder;
    let revealed = false;
    const reveal = () => {
      if (revealed || previewHolder !== ph) return;
      revealed = true;
      clearTimeout(previewRevealTimer);
      ph.classList.add("is-ready");
      root.classList.add("is-previewing");
    };

    // Sécurité : si "playing" n'arrive jamais, on affiche quand même l'aperçu
    previewRevealTimer = setTimeout(reveal, PREVIEW_REVEAL_TIMEOUT_MS);

    const target = previewHolder.firstElementChild;

    // Plyr indisponible : vidéo native brute
    if (typeof window.Plyr === "undefined") {
      if (target.tagName === "VIDEO") {
        target.muted = true;
        target.addEventListener("playing", reveal, { once: true });
        // Reboucle à autoplayStart (ou au début si 0)
        target.addEventListener("ended", () => {
          target.currentTime = autoplayStart;
          target.play().catch(() => {});
        });
        target.play().catch(() => {});
      }
      return;
    }

    const pl = new window.Plyr(target, {
      controls: [],
      clickToPlay: false,
      keyboard: { focused: false, global: false },
      fullscreen: { enabled: false },
      // Boucle gérée à la main (voir "ended") pour pouvoir reboucler à autoplayStart
      loop: { active: false },
      tooltips: { controls: false, seek: false },
    });
    previewPlayer = pl;

    pl.once("playing", reveal);
    pl.once("timeupdate", reveal);

    // Reboucle à autoplayStart (ou au début si 0)
    pl.on("ended", () => {
      if (previewPlayer !== pl) return;
      pl.currentTime = autoplayStart;
      const p = pl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    });

    const run = () => {
      if (previewPlayer !== pl) return; // détruit entre-temps
      pl.muted = true;
      // Fichier natif : le départ est déjà géré par #t= ; embed : on se positionne ici
      if (autoplayStart > 0 && !isNative) pl.currentTime = autoplayStart;
      // Sorti de l'écran pendant le chargement : on reste en pause
      if (!inView) {
        previewPaused = true;
        return;
      }
      const p = pl.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    if (isNative) run();
    else pl.once("ready", run);
  }

  // Visible : crée l'aperçu une seule fois, puis le reprend. Hors écran : pause
  // (jamais détruit, donc pas de rechargement ni de frame noire à chaque entrée).
  function syncPreview() {
    if (!autoplay) return;

    if (inView && !holder) {
      if (previewHolder) {
        resumePreview();
        return;
      }
      if (previewTimer) return; // déjà programmé
      if (autoplayDelay <= 0) {
        startPreview();
        return;
      }
      previewTimer = setTimeout(() => {
        previewTimer = null;
        if (inView && !holder) startPreview();
      }, autoplayDelay * 1000);
    } else {
      pausePreview();
    }
  }

  // ---- Lecteur classique ----
  // Remet l'aperçu (ou le poster) : détruit le lecteur, retire le conteneur
  function stop() {
    clearTimeout(revealTimer);
    clearTimeout(cleanupTimer);
    revealTimer = null;
    cleanupTimer = null;

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
    root.removeEventListener("click", blockLink, true);
    root.classList.remove("is-playing");
    if (activeStop === stop) activeStop = null;

    syncPreview();
  }

  function start(e) {
    if (e) {
      // Si la carte est un lien <a>, on empêche la navigation
      e.preventDefault();
      e.stopPropagation();
    }
    if (holder) return; // déjà en lecture

    claimPlayback(stop);

    // Plus de nouvel aperçu pendant la lecture ; l'aperçu en cours reste affiché
    // sous le lecteur jusqu'à ce que celui-ci soit prêt (évite le clignotement)
    clearPreviewTimer();
    root.classList.add("is-playing");

    holder = document.createElement("div");
    // Invisible (opacity 0 en CSS) jusqu'à ce que la lecture démarre vraiment
    holder.className = "video_player-holder swiper-no-swiping";
    holder.innerHTML = buildPlayerMarkup(src, captions, title);
    host.appendChild(holder);

    // Le lecteur peut se trouver dans un <a> : aucun clic dedans ne doit ouvrir le lien
    root.addEventListener("click", blockLink, true);

    const h = holder;
    let revealed = false;

    // Le lecteur apparaît en fondu, puis l'aperçu en dessous est retiré
    const reveal = () => {
      if (revealed || holder !== h) return;
      revealed = true;
      clearTimeout(revealTimer);
      h.classList.add("is-ready");
      cleanupTimer = setTimeout(() => {
        cleanupTimer = null;
        if (holder === h) stopPreview();
      }, FADE_MS + 50);
    };
    revealTimer = setTimeout(reveal, REVEAL_TIMEOUT_MS);

    const target = holder.firstElementChild;

    // Plyr indisponible : lecteur natif
    if (typeof window.Plyr === "undefined") {
      if (target.tagName === "VIDEO") {
        target.controls = true;
        target.addEventListener("playing", reveal, { once: true });
        target.addEventListener("ended", () => stop(), { once: true });
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

    player.once("playing", reveal);

    if (isNative) player.play();
    else player.once("ready", () => player.play());

    player.on("loadedmetadata", () => setTimer(timerEl, formatDuration(player.duration)));

    // Fin de lecture : retour à l'aperçu / au poster (évite l'écran "autres vidéos" de Vimeo)
    player.on("ended", () => stop());
  }

  if (trigger) {
    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-label", "Voir la vidéo");
    trigger.addEventListener("click", start);
    trigger.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        start(ev);
      }
    });
  }

  // Aperçu : lancé/mis en pause selon la visibilité à l'écran
  if (autoplay) {
    if (typeof IntersectionObserver === "undefined") {
      syncPreview();
    } else {
      inView = false;
      new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          syncPreview();
        },
        { threshold: 0.25 },
      ).observe(root);
    }
  }
}

function readMagnet(el) {
  return el.dataset.videoMagnet !== undefined ? parseFloat(el.dataset.videoMagnet) : DEFAULT_MAGNET;
}

// Autoplay actif si l'attribut est présent (et différent de "false"),
// sauf si l'utilisateur préfère moins d'animations
function readAutoplay(el) {
  const v = el.dataset.videoAutoplay;
  if (v === undefined || v === "false") return false;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }
  return true;
}

// Délai avant le début de l'aperçu (secondes)
function readAutoplayDelay(el) {
  const v = parseFloat(el.dataset.videoAutoplayDelay);
  return isFinite(v) && v >= 0 ? v : DEFAULT_AUTOPLAY_DELAY;
}

// Seconde de départ de l'aperçu
function readAutoplayStart(el) {
  const v = parseFloat(el.dataset.videoAutoplayStart);
  return isFinite(v) && v > 0 ? v : 0;
}

// Section principale
function initOne(media) {
  const src = media.dataset.videoPlayer;
  if (!src) return;

  const layout = media.closest(".video_layout") || media.parentElement;

  setupPlayback({
    root: layout,
    host: media.querySelector("[data-video-host]") || media,
    trigger: layout.querySelector("[data-video-play]"),
    timerEl: layout.querySelector("[data-video-timer]"),
    src,
    captions: media.dataset.videoCaptions || "",
    title: media.dataset.videoTitle || "",
    duration: media.dataset.videoDuration,
    magnet: readMagnet(media),
    autoplay: readAutoplay(media),
    autoplayDelay: readAutoplayDelay(media),
    autoplayStart: readAutoplayStart(media),
  });
}

// Cartes (personas, presse...)
function initCard(card) {
  const src = card.dataset.videoPlayer;
  if (!src) return;

  setupPlayback({
    root: card,
    host:
      card.querySelector("[data-video-host]") ||
      card.querySelector(".personas_card-banner") ||
      card,
    trigger: card.querySelector(".video_controller"),
    timerEl: card.querySelector(".video_controller-time"),
    src,
    captions: card.dataset.videoCaptions || "",
    title: card.dataset.videoTitle || "",
    duration: card.dataset.videoDuration,
    magnet: readMagnet(card),
    autoplay: readAutoplay(card),
    autoplayDelay: readAutoplayDelay(card),
    autoplayStart: readAutoplayStart(card),
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

  // Cartes
  root.querySelectorAll("[data-video-card]:not([data-video-ready])").forEach((card) => {
    card.setAttribute("data-video-ready", "true");
    initCard(card);
  });
}