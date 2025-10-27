// Progressive enhancement flag
document.documentElement.classList.add('has-js');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.querySelector('[data-anim="name"]');
  const cues = document.querySelectorAll('.cue');

  // Fallback: show static
  if (reduce || typeof gsap === 'undefined') {
    if (nameEl) { nameEl.style.opacity = 1; nameEl.style.transform = 'none'; }
    cues.forEach(c => { c.style.opacity = 1; c.style.transform = 'none'; });
    return;
  }

  // Intro animation
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.fromTo(nameEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9 });
  tl.fromTo(cues, { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 }, '+=0.8');
  tl.to(cues, { y: 12, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' }, '>-0.1');
});


/* ===== Logiciels marquee — GSAP ticker + smooth hover pause + label ===== */
(() => {
  const marquee = document.querySelector(".logo-marquee");
  const track = document.querySelector(".logo-track");
  const labelEl = document.getElementById("logoLabel");
  if (!marquee || !track || !labelEl || track.dataset.gsapInit) return;
  track.dataset.gsapInit = "true";

  if (typeof gsap === "undefined") {
    console.warn("[LogoMarquee] GSAP not found.");
    return;
  }


  // ---- CONFIG ----
  const files = [
    "After Effect.png", "Adobe Illustrator.png", "Maya 3D.png", "Blender.png",
    "GitHub.png", "Photoshop.png", "JavaScript.png", "Unity.png",
    "Html.png", "Figma.png", "Davinci.png", "Visual Studio Code.png",
    "Gimp.png", "Unreal Engine.png", "TouchDesigner.png", "Css.png"
  ];
  const baseSpeed = parseFloat(marquee.dataset.speed ?? "0.7"); // px/frame @60fps
  const stopEase = "power2.out";
  const stopTime = 0.35;
  const friction = 0.92; // momentum decay (0.85–0.96 = more/less glide)


  // ---- BUILD ONE SET ----
  const unitHTML = files.map(n => {
    const label = n.replace(/\.[a-z]+$/i, "").replace(/[-_]/g, " ");
    return `<li><img src="images/logos/${n}" alt="${label} logo" draggable="false" data-label="${label}"></li>`;
  }).join("");
  track.innerHTML = unitHTML;


  // Wait images
  const imgs = [...track.querySelectorAll("img")];
  const loaded = Promise.all(imgs.map(img =>
    img.complete ? 1 : new Promise(r => img.addEventListener("load", r, { once: true }))
  ));


  loaded.then(() => {
    const unitWidth = track.scrollWidth;

    // Duplicate until we have plenty (≥ 2× viewport + 1 unit)
    while (track.scrollWidth < marquee.clientWidth * 2 + unitWidth) {
      track.insertAdjacentHTML("beforeend", unitHTML);
    }


    // --- SCROLL STATE ---
    let x = 0;              // current translateX
    let speedScale = 1;     // 1 = cruise, 0 = stopped (hover/drag)
    let isDragging = false;
    let dragVX = 0;         // momentum velocity
    let lastX = 0;
    let lastT = 0;

    const setX = v => gsap.set(track, { x: Math.round(v) });
    const wrapX = () => {
      if (x <= -unitWidth) x += unitWidth;
      if (x >= 0) x -= unitWidth;
    };

    // GSAP ticker: crawl + momentum
    const tick = () => {
      x -= baseSpeed * speedScale;       // base crawl
      if (!isDragging && Math.abs(dragVX) > 0.02) {
        x += dragVX;                     // momentum from last drag
        dragVX *= friction;
      }
      wrapX();
      setX(x);
    };


    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.ticker.add(tick);
    } else {
      setX(0);
    }


    // Smooth pause/resume helpers
    let hoverTw;
    const easeTo = target => {
      hoverTw?.kill();
      hoverTw = gsap.to({ v: speedScale }, {
        v: target, duration: stopTime, ease: stopEase,
        onUpdate() { speedScale = this.targets()[0].v; }
      });
    };


    // Pause on hover (unless dragging)
    marquee.addEventListener("mouseenter", () => { if (!isDragging) easeTo(0); });
    marquee.addEventListener("mouseleave", () => { if (!isDragging) easeTo(1); });



    // Label show/hide
    const showLabel = text => {
      labelEl.textContent = text;
      gsap.killTweensOf(labelEl);
      gsap.to(labelEl, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" });
    };
    const hideLabel = () => {
      gsap.killTweensOf(labelEl);
      gsap.to(labelEl, { opacity: 0, y: 6, duration: 0.22, ease: "power2.in" });
    };
    track.addEventListener("pointerover", e => {
      const img = e.target.closest("img");
      if (img) showLabel(img.dataset.label || img.alt.replace(/\s*logo$/i, ""));
    });
    track.addEventListener("pointerout", e => {
      if (e.relatedTarget && track.contains(e.relatedTarget)) return;
      hideLabel();
    });
    track.addEventListener("focusin", e => {
      const img = e.target.closest("img");
      if (img) showLabel(img.dataset.label || img.alt.replace(/\s*logo$/i, ""));
    });
    track.addEventListener("focusout", hideLabel);



    // ---- DRAGGING (pointer events = mouse + touch) ----
    const onDown = (e) => {
      e.preventDefault();
      isDragging = true;
      marquee.classList.add("is-dragging");
      marquee.setPointerCapture?.(e.pointerId);
      easeTo(0);                    // glide to stop while grabbing
      dragVX = 0;
      lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      lastT = performance.now();
    };

    const onMove = (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const cur = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = cur - lastX;
      const dt = Math.max(1, now - lastT);

      x += dx;               // drag the strip directly
      wrapX();
      setX(x);

      dragVX = dx * (60 / dt); // px/frame equivalent
      lastX = cur; lastT = now;
    };

    const onUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      marquee.classList.remove("is-dragging");
      marquee.releasePointerCapture?.(e.pointerId);

      // After momentum decays, resume cruise
      const check = () => {
        if (Math.abs(dragVX) < 0.15) { dragVX = 0; easeTo(1); }
        else gsap.delayedCall(0.1, check);
      };
      check();
    };

    marquee.addEventListener("pointerdown", onDown, { passive: false });
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { passive: true });

    // Prevent native image drag ghost
    track.addEventListener("dragstart", e => e.preventDefault());
  });

  



})();






