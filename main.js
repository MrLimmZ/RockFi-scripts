(()=>{function q(e){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e):e()}function A(){return window.matchMedia("(prefers-reduced-motion: reduce)").matches}var E=null;function ot(){if(typeof window.Lenis=="undefined"||A())return null;E=new window.Lenis({duration:1.2,smoothWheel:!0});function e(t){E.raf(t),requestAnimationFrame(e)}return requestAnimationFrame(e),E}function k(){ot()}function C(){document.querySelectorAll("[data-collapse]").forEach(t=>{let r=t.querySelector("[data-collapse-trigger]"),i=t.querySelector("[data-collapse-content]");!r||!i||r.addEventListener("click",()=>{let n=t.classList.contains("is-open");t.classList.toggle("is-open",!n)})})}function M(){let e=document.querySelectorAll(".tag");if(!e.length)return;let t=new IntersectionObserver(r=>{r.forEach(i=>{i.isIntersecting&&(i.target.classList.add("is-visible"),t.unobserve(i.target))})},{threshold:.4});e.forEach(r=>t.observe(r))}function j(){let t=window.innerWidth<992;document.querySelectorAll(".content_text.is-desktop").forEach(i=>{if(!i.dataset.fsTocSaved){let o=[];Array.prototype.slice.call(i.attributes).forEach(a=>{a.name.startsWith("fs-toc")&&o.push({name:a.name,value:a.value})}),i.dataset.fsTocSaved=JSON.stringify(o)}let n=i.dataset.fsTocSaved?JSON.parse(i.dataset.fsTocSaved):[];t?n.forEach(o=>i.removeAttribute(o.name)):n.forEach(o=>{i.hasAttribute(o.name)||i.setAttribute(o.name,o.value)})})}function I(){j();let e;window.addEventListener("resize",()=>{clearTimeout(e),e=setTimeout(j,150)})}function R(){let e=document.querySelectorAll(".accordion1_component");e.length&&e.forEach(t=>{let r=t.querySelector(".accordion1_top"),i=t.querySelector(".accordion1_bottom"),n=t.querySelector(".accordion1_icon");!r||!i||(i.style.height="0px",r.addEventListener("click",()=>{i.style.height!=="0px"?(i.style.height="0px",n&&(n.style.transform="rotateZ(0deg)")):(i.style.height=i.scrollHeight+"px",n&&(n.style.transform="rotateZ(180deg)"))}))})}function L(e){let t=document.querySelector(".toast-copy");t||(t=document.createElement("div"),t.className="toast-copy",t.setAttribute("role","status"),t.setAttribute("aria-live","polite"),document.body.appendChild(t)),t.textContent=e,t.offsetWidth,t.classList.add("is-visible"),clearTimeout(L._timer),L._timer=setTimeout(()=>t.classList.remove("is-visible"),2500)}function B(){let e=document.querySelector('link[rel="canonical"]');return(e?e.href:window.location.href).split("#")[0]}function nt(e){return navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(e):new Promise((t,r)=>{let i=document.createElement("textarea");i.value=e,i.setAttribute("readonly",""),i.style.position="fixed",i.style.top="-9999px",document.body.appendChild(i),i.select();let n=document.execCommand("copy");document.body.removeChild(i),n?t():r()})}function P(){document.querySelectorAll(".link-page").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault(),nt(B()).then(()=>L("Lien bien copi\xE9")).catch(()=>L("Impossible de copier le lien"))})}),document.querySelectorAll(".link-page-linkedin").forEach(e=>{e.addEventListener("click",t=>{t.preventDefault();let r="https://www.linkedin.com/feed/?shareActive=true&shareUrl="+encodeURIComponent(B());window.open(r,"_blank","noopener,noreferrer")})})}var at=/(?:<p>)?\[table(\s+split)?\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/table\](?:<\/p>)?/gi;function lt(e){return e.split(",").map(t=>t.trim())}function X(e){return e.replace(at,(t,r,i)=>{let n=!!r,o=i.replace(/<\/p>|<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(l=>l.trim()).filter(Boolean).map(lt);if(!o.length)return t;let[a,...s]=o,d=`<tr>${a.map(l=>`<th scope="col">${l}</th>`).join("")}</tr>`,f=s.map(l=>{if(!n)return`<tr>${l.map(y=>`<td>${y}</td>`).join("")}</tr>`;let[m,...g]=l,x=g.map(y=>`<td>${y}</td>`).join("");return`<tr><th scope="row">${m}</th>${x}</tr>`}).join("");return`
      <div class="rt-table-wrap rf-wrap">
        <table class="rt-table${n?" rt-table--split":""}">
          <thead>${d}</thead>
          <tbody>${f}</tbody>
        </table>
      </div>
    `})}var st=/(?:<p>)?\[list\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/list\](?:<\/p>)?/gi,ct=/\[b\](.*?)\[\/b\]/gi;function dt(e){return e.replace(ct,'<strong class="rt-bold">$1</strong>')}function H(e){return e.replace(st,(t,r)=>{let i=r.replace(/<\/p>|<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(o=>o.trim()).filter(Boolean);return i.length?`<div class="rf-wrap"><ul class="rt-list rt-text" role="list">${i.map(o=>`
          <li class="rt-list-item">
            <span class="rt-list-bullet" aria-hidden="true"></span>
            <span class="rt-list-content">${dt(o)}</span>
          </li>
        `).join("")}</ul></div>`:t})}var pt=/(?:<p>)?\[calc\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/calc\](?:<\/p>)?/gi;function D(e){return e.replace(pt,(t,r)=>{let i=r.replace(/<\/p>|<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(l=>l.trim()).filter(Boolean);if(!i.length)return t;let n=[],o=[],a=null,s=!1;i.forEach(l=>{if(/^title:/i.test(l)){a={title:l.replace(/^title:/i,"").trim(),lines:[]},n.push(a);return}if(/^-{3,}$/.test(l)){s=!0;return}if(s){o.push(l);return}a&&a.lines.push(l)});let d=n.map(l=>`
          <div class="rt-calc-block">
            <h4 class="rt-calc-title">${l.title}</h4>
            ${l.lines.map(m=>`<p class="rt-calc-line">${m}</p>`).join("")}
          </div>
        `).join(""),f=o.length?`
        <div class="rt-calc-footer">
          <p class="rt-calc-note">${o.join(" ")}</p>
        </div>
      `:"";return`
      <div class="rf-wrap">
        <div class="rt-calc">
          ${d}
          ${f}
        </div>
      </div>
    `})}var G=/(\w+)="([^"]*)"/g;function w(e=""){let t={},r;for(G.lastIndex=0;(r=G.exec(e))!==null;)t[r[1]]=r[2];return t}var ut=/(?:<p>)?\[button([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/button\](?:<\/p>)?/gi;function ft(e){return`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-1.69982" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_0_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="2.07751" cy="2.08166" r="1.31507" transform="rotate(-180 2.07751 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="-0.110111" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_1_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="2.08166" r="1.31507" transform="rotate(-180 8.00524 2.08166)" fill="white"/>
<foreignObject x="10.142" y="-1.69494" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_2_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="13.9193" cy="2.08166" r="1.31507" transform="rotate(-180 13.9193 2.08166)" fill="white" fill-opacity="0.1"/>
<foreignObject x="-0.114994" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_3_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="2.07751" cy="7.99841" r="1.31507" transform="rotate(-180 2.07751 7.99841)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_4_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="7.99841" r="1.31507" transform="rotate(-180 8.00524 7.99841)" fill="white" fill-opacity="0.1"/>
<foreignObject x="11.7268" y="5.80664" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_5_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="13.9193" cy="7.99841" r="1.31507" transform="rotate(-180 13.9193 7.99841)" fill="white"/>
<foreignObject x="-1.69982" y="10.1408" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_6_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="2.07751" cy="13.9174" r="1.31507" transform="rotate(-180 2.07751 13.9174)" fill="white" fill-opacity="0.1"/>
<foreignObject x="5.81274" y="11.7256" width="4.38428" height="4.38355"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(0.44px);clip-path:url(#bgblur_7_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="0.876712" cx="8.00524" cy="13.9174" r="1.31507" transform="rotate(-180 8.00524 13.9174)" fill="white"/>
<foreignObject x="10.142" y="10.1408" width="7.55394" height="7.55321"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(1.23px);clip-path:url(#bgblur_8_27936_9718_clip_path);height:100%;width:100%"></div></foreignObject><circle data-figma-bg-blur-radius="2.46154" cx="13.9193" cy="13.9174" r="1.31507" transform="rotate(-180 13.9193 13.9174)" fill="white" fill-opacity="0.1"/>
<defs>
<clipPath id="bgblur_0_27936_9718_clip_path" transform="translate(1.69982 1.69494)"><circle cx="2.07751" cy="2.08166" r="1.31507" transform="rotate(-180 2.07751 2.08166)"/>
</clipPath><clipPath id="bgblur_1_27936_9718_clip_path" transform="translate(-5.81274 0.110111)"><circle cx="8.00524" cy="2.08166" r="1.31507" transform="rotate(-180 8.00524 2.08166)"/>
</clipPath><clipPath id="bgblur_2_27936_9718_clip_path" transform="translate(-10.142 1.69494)"><circle cx="13.9193" cy="2.08166" r="1.31507" transform="rotate(-180 13.9193 2.08166)"/>
</clipPath><clipPath id="bgblur_3_27936_9718_clip_path" transform="translate(0.114994 -5.80664)"><circle cx="2.07751" cy="7.99841" r="1.31507" transform="rotate(-180 2.07751 7.99841)"/>
</clipPath><clipPath id="bgblur_4_27936_9718_clip_path" transform="translate(-5.81274 -5.80664)"><circle cx="8.00524" cy="7.99841" r="1.31507" transform="rotate(-180 8.00524 7.99841)"/>
</clipPath><clipPath id="bgblur_5_27936_9718_clip_path" transform="translate(-11.7268 -5.80664)"><circle cx="13.9193" cy="7.99841" r="1.31507" transform="rotate(-180 13.9193 7.99841)"/>
</clipPath><clipPath id="bgblur_6_27936_9718_clip_path" transform="translate(1.69982 -10.1408)"><circle cx="2.07751" cy="13.9174" r="1.31507" transform="rotate(-180 2.07751 13.9174)"/>
</clipPath><clipPath id="bgblur_7_27936_9718_clip_path" transform="translate(-5.81274 -11.7256)"><circle cx="8.00524" cy="13.9174" r="1.31507" transform="rotate(-180 8.00524 13.9174)"/>
</clipPath><clipPath id="bgblur_8_27936_9718_clip_path" transform="translate(-10.142 -10.1408)"><circle cx="13.9193" cy="13.9174" r="1.31507" transform="rotate(-180 13.9193 13.9174)"/>
</clipPath></defs>
</svg>`.split("27936_9718").join(e).split('fill="white"').join('fill="currentColor"')}var V=0;function K(e){return e.replace(ut,(t,r,i)=>{let n=w(r),o=n.href||"#",a=i.replace(/<[^>]+>/g,"").trim();if(!a)return t;let s=n.icon!=="false";V+=1;let d=s?`<div class="rt-button-icon">${ft(`rtbtn${V}`)}</div>`:"";return`<div class="rf-wrap"><a href="${o}" class="rt-button">${d}<div>${a}</div></a></div>`})}var mt=/(?:<p>)?\[quote(?=[\s\]])([^\]]*)\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote\](?:<\/p>)?/gi;function N(e){return e.replace(mt,(t,r,i)=>{let n=w(r),o=i.replace(/<\/p>|<br\s*\/?>/gi," ").replace(/<[^>]+>/g,"").trim();if(!o)return t;let a=n.name||"",s=n.role||"",d=n.img||"",f=a||d?`
          <div class="rt-quote-author">
            ${d?`<img src="${d}" alt="${a}" class="rt-quote-avatar">`:""}
            <div class="rt-quote-author-info">
              ${a?`<p class="rt-quote-name">${a}</p>`:""}
              ${s?`<p class="rt-quote-role">${s}</p>`:""}
            </div>
          </div>
        `:"";return`
      <div class="rf-wrap">
        <div class="rt-quote">
          <p class="rt-quote-text">&ldquo;${o}&rdquo;</p>
          ${f}
        </div>
      </div>
    `})}var ht=/(?:<p>)?\[quote-large\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/quote-large\](?:<\/p>)?/gi;function z(e){return e.replace(ht,(t,r)=>{let i=r.replace(/<\/p>|<br\s*\/?>/gi," ").replace(/<[^>]+>/g,"").trim();return i?`
      <div class="rf-wrap">
        <blockquote class="rt-quote-large">&ldquo;${i}&rdquo;</blockquote>
      </div>
    `:t})}var gt=/(?:<p>)?\[slider\](?:<\/p>)?([\s\S]*?)(?:<p>)?\[\/slider\](?:<\/p>)?/gi,W='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.00003 4L10 8L6 12" stroke="#1A1A1A" stroke-miterlimit="16" stroke-linecap="round" stroke-linejoin="round"/></svg>';function bt(e){return e.replace(/<\/p>|<br\s*\/?>/gi,`
`).replace(/<[^>]+>/g,"").split(`
`).map(r=>r.trim()).filter(Boolean).map(r=>{let i=r.split("|").map(s=>s.trim()),n=i[0],o=i[1]||"";if(!n)return"";let a=o?`<figcaption class="rt-slider-caption">${o}</figcaption>`:"";return`
        <div class="rt-slider-item">
          <img src="${n}" alt="${o}" loading="lazy" draggable="false">
          ${a}
        </div>
      `}).join("")}function U(e){return e.replace(gt,(t,r)=>{let i=bt(r);return i?`
      <div class="rt-slider">
        <div class="rt-slider-track">${i}</div>
        <div class="rt-slider-controls">
          <button type="button" class="rt-slider-prev" aria-label="Image pr\xE9c\xE9dente">${W}</button>
          <button type="button" class="rt-slider-next" aria-label="Image suivante">${W}</button>
        </div>
      </div>
    `:t})}function vt(e){let t=e.querySelector(".rt-slider-track"),r=Array.from(e.querySelectorAll(".rt-slider-item")),i=e.querySelector(".rt-slider-prev"),n=e.querySelector(".rt-slider-next");if(!t||!r.length)return;let o=0,a=0,s=!1,d=0,f=0,l=0,m=0,g=0,x=3,y=.15,tt=.5,et="transform 1.3s cubic-bezier(0.16, 1, 0.3, 1)";function S(){return Math.max(0,t.scrollWidth-e.clientWidth)}function rt(){let c=window.getComputedStyle(t);return-new DOMMatrixReadOnly(c.transform).m41}function O(c,p){t.style.transition=p?et:"none",a=c,t.style.transform=`translateX(-${c}px)`}function b(c,p=!0){o=Math.min(Math.max(c,0),r.length-1);let h=S(),_=Math.min(r[o].offsetLeft,h);O(_,p),i&&(i.disabled=o===0),n&&(n.disabled=o===r.length-1)}i&&i.addEventListener("click",()=>b(o-1)),n&&n.addEventListener("click",()=>b(o+1)),t.addEventListener("pointerdown",c=>{let p=rt();t.style.transition="none",t.style.transform=`translateX(-${p}px)`,a=p,s=!0,d=c.clientX,f=a,l=c.clientX,m=performance.now(),g=0,t.classList.add("is-dragging"),t.setPointerCapture(c.pointerId)}),t.addEventListener("pointermove",c=>{if(!s)return;let p=performance.now(),h=p-m;h>0&&(g=(c.clientX-l)/h),l=c.clientX,m=p;let _=c.clientX-d,u=f-_,v=S();u<0?u=u/x:u>v&&(u=v+(u-v)/x),O(u,!1)});function T(c){var v;if(!s)return;s=!1,t.classList.remove("is-dragging");let h=((v=c.clientX)!=null?v:l)-d,_=Math.min(e.clientWidth*y,100),u=Math.abs(g)>tt;if(Math.abs(h)>_||u){let it=h>0||u&&g>0?-1:1;b(o+it,!0)}else b(o,!0)}t.addEventListener("pointerup",T),t.addEventListener("pointercancel",T);let $;window.addEventListener("resize",()=>{clearTimeout($),$=setTimeout(()=>b(o,!1),150)}),b(0,!1)}function F(e=document){e.querySelectorAll(".rt-slider:not([data-slider-initialized])").forEach(t=>{t.setAttribute("data-slider-initialized","true"),vt(t)})}var wt=/(?:<p>)?\[video([^\]]*)\](?:<\/p>)?/gi;function yt(e){let t=e.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);if(t)return{type:"youtube",id:t[1]};let r=e.match(/vimeo\.com\/(\d+)/);return r?{type:"vimeo",id:r[1]}:{type:"native",id:null}}function _t(e,t){let r=yt(e);return r.type==="youtube"?`<div class="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id="${r.id}"></div>`:r.type==="vimeo"?`<div class="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id="${r.id}"></div>`:`<video playsinline${t?` poster="${t}"`:""}><source src="${e}" type="video/mp4"></video>`}function xt(e){return`<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<foreignObject x="-48" y="-48" width="144" height="144"><div xmlns="http://www.w3.org/1999/xhtml" style="backdrop-filter:blur(24px);clip-path:url(#bgblur_0_102_1211_clip_path);height:100%;width:100%"></div></foreignObject><g data-figma-bg-blur-radius="48">
<rect width="48" height="48" rx="24" fill="white" fill-opacity="0.2"></rect>
<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 19.8599C19.5 18.9472 20.5008 18.388 21.2781 18.8663L28.0061 23.0066C28.7464 23.4622 28.7464 24.5382 28.0061 24.9938L21.2781 29.1341C20.5008 29.6124 19.5 29.0532 19.5 28.1405V19.8599Z" fill="white"></path>
</g>
<defs>
<clipPath id="bgblur_0_102_1211_clip_path" transform="translate(48 48)"><rect width="48" height="48" rx="24"></rect>
</clipPath></defs>
</svg>`.split("102_1211").join(e)}function Lt(e){if(!e||!isFinite(e))return"";let t=Math.floor(e/60),r=Math.floor(e%60);return`${t}:${String(r).padStart(2,"0")}`}var Q=0;function Z(e){return e.replace(wt,(t,r)=>{let i=w(r),n=i.src||"",o=i.poster||"";if(!n)return t;Q+=1;let a=xt(`rtvid${Q}`);return`
      <div class="rt-video">
        <div class="rt-video-player">${_t(n,o)}</div>
        <div class="rt-video-overlay">
          <div class="rt-video-gradient"></div>
          <div class="rt-video-cta">
            <button type="button" class="rt-video-play-glass" aria-label="Voir la vid\xE9o">${a}</button>
            <div class="rt-video-cta-meta">
              <span class="rt-video-cta-text">Voir la vid\xE9o</span>
              <span class="rt-video-cta-duration"></span>
            </div>
          </div>
        </div>
      </div>
    `})}function J(e=document){e.querySelectorAll(".rt-video:not([data-video-initialized])").forEach(t=>{if(t.setAttribute("data-video-initialized","true"),typeof window.Plyr=="undefined")return;let r=t.querySelector(".rt-video-player").firstElementChild,i=new window.Plyr(r,{controls:["play","progress","current-time","mute","volume","fullscreen"]}),n=t.querySelector(".rt-video-play-glass"),o=t.querySelector(".rt-video-cta-duration");n.addEventListener("click",()=>i.play()),i.on("play",()=>t.classList.add("is-playing")),i.on("pause",()=>t.classList.remove("is-playing")),i.on("loadedmetadata",()=>{let a=Lt(i.duration);a&&(o.textContent=a)})})}function Y(e=document){let t=e.querySelector(".rich-text_blog");if(!t)return;let r=t.innerHTML;r=X(r),r=H(r),r=D(r),r=K(r),r=N(r),r=z(r),r=U(r),r=Z(r),t.innerHTML=r,F(t),J(t)}var Et=new Date().toISOString().slice(0,10);console.log(`%c[RockFi] main.js \u2014 build v1.0.0 ${Et}`,"color:#7dd3fc");q(()=>{k(),C(),M(),I(),R(),P(),Y()});})();
