// src/embeds/video-enhance.js
// transformVideo(html) : pur texte, génère le markup .rt-video.
// initVideoListeners(root) : instancie Plyr + câble l'overlay custom sur
// les nœuds DOM finaux, appelé une seule fois après le write global.

import { parseAttrs } from "../utils/parse-attrs.js";

const VIDEO_BLOCK_REGEX = /(?:<p>)?\[video([^\]]*)\](?:<\/p>)?/gi;

function getVideoInfo(src) {
  const ytMatch = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  if (ytMatch) return { type: "youtube", id: ytMatch[1] };

  const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return { type: "vimeo", id: vimeoMatch[1] };

  return { type: "native", id: null };
}

function buildPlayerMarkup(src, poster) {
  const info = getVideoInfo(src);

  if (info.type === "youtube") {
    return `<div class="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${info.id}"></div>`;
  }
  if (info.type === "vimeo") {
    return `<div class="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id="${info.id}"></div>`;
  }
  const posterAttr = poster ? ` poster="${poster}"` : "";
  return `<video playsinline${posterAttr}><source src="${src}" type="video/mp4"></video>`;
}

function buildGlassIconSVG(idSuffix) {
  const raw = `<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-48" y="-48" width="144" height="144"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(24px);clip-path:url(#bgblur_0_102_1211_clip_path);height:100%;width:100%"></div></foreignObject><g data-figma-bg-blur-radius="48">
<rect width="48" height="48" rx="24" fill="white" fill-opacity="0.2"></rect>
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 19.8599C19.5 18.9472 20.5008 18.388 21.2781 18.8663L28.0061 23.0066C28.7464 23.4622 28.7464 24.5382 28.0061 24.9938L21.2781 29.1341C20.5008 29.6124 19.5 29.0532 19.5 28.1405V19.8599Z" fill="white"></path>
</g>
<defs>
<clipPath id="bgblur_0_102_1211_clip_path" transform="translate(48 48)"><rect width="48" height="48" rx="24"></rect>
</clipPath></defs>
</svg>`;

  return raw.split("102_1211").join(idSuffix);
}

function formatDuration(seconds) {
  if (!seconds || !isFinite(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

let videoInstanceCounter = 0;

export function transformVideo(html) {
  return html.replace(VIDEO_BLOCK_REGEX, (match, attrString) => {
    const attrs = parseAttrs(attrString);
    const src = attrs.src || "";
    const poster = attrs.poster || "";
    if (!src) return match;

    videoInstanceCounter += 1;
    const iconSVG = buildGlassIconSVG(`rtvid${videoInstanceCounter}`);

    return `
      <div class="rt-video">
        <div class="rt-video-player">${buildPlayerMarkup(src, poster)}</div>
        <div class="rt-video-overlay">
          <div class="rt-video-gradient"></div>
          <div class="rt-video-cta">
            <button type="button" class="rt-video-play-glass" aria-label="Voir la vidéo">${iconSVG}</button>
            <div class="rt-video-cta-meta">
              <span class="rt-video-cta-text">Voir la vidéo</span>
              <span class="rt-video-cta-duration"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
}

export function initVideoListeners(root = document) {
  root.querySelectorAll(".rt-video:not([data-video-initialized])").forEach((el) => {
    el.setAttribute("data-video-initialized", "true");
    if (typeof window.Plyr === "undefined") return;

    const target = el.querySelector(".rt-video-player").firstElementChild;
    const player = new window.Plyr(target, {
      controls: ["play", "progress", "current-time", "mute", "volume", "fullscreen"],
    });

    const glassBtn = el.querySelector(".rt-video-play-glass");
    const durationEl = el.querySelector(".rt-video-cta-duration");

    glassBtn.addEventListener("click", () => player.play());

    player.on("play", () => el.classList.add("is-playing"));
    player.on("pause", () => el.classList.remove("is-playing"));

    player.on("loadedmetadata", () => {
      const formatted = formatDuration(player.duration);
      if (formatted) durationEl.textContent = formatted;
    });
  });
}