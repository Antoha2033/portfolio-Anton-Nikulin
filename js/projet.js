// projet.js — simple Options API, single app, one mount, fetch in mounted()

// If you use GSAP/ScrollTrigger on this page, make sure their <script> tags
// are included BEFORE this file in projet.html.
document.documentElement.classList.add('has-js');

const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

const app = Vue.createApp({
  data() {
    return {
      loading: true,
      error: '',
      all: [],
      project: null
    };
  },

  async mounted() {
    try {
      // 1) Fetch your projects.json (single path, no fallback logic)
      const res = await fetch('data/projects.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.all = await res.json();

      // 2) Pick the project using ?proj-id= from the URL (as per course notes)
      const params = new URLSearchParams(location.search);
      const projId = params.get('proj-id'); // e.g. projet.html?proj-id=78
      this.project = this.all.find(p => String(p.id) === String(projId)) || this.all[0];

      // 3) Update <title> (optional)
      if (this.project?.title) document.title = `${this.project.title} — Portfolio`;

      // 4) After DOM updates, play the intro once the nodes exist
      await Vue.nextTick();
      waitForIntroNodes(runIntroAnimNow); // ✅ you have this function defined

    } catch (err) {
      this.error = 'Impossible de charger les projets.';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
});

/* ---------- ScrollTrigger reveal (tidy version) ---------- */
/* Runs after Vue renders (same behavior as your old code), 
   respects prefers-reduced-motion, and refreshes after images load. */

(() => {
  const mm = gsap.matchMedia();                       // responsive & a11y helper. Docs: gsap.matchMedia
  const SELECTOR = '.project-slice';
  const SETTINGS = { start: 'top 80%', ease: 'power3.out', dur: 0.9 };

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Clear previous triggers if this re-runs (hot reload / SPA nav)
    ScrollTrigger.getAll().forEach(t => t.kill());

    gsap.utils.toArray(SELECTOR).forEach((slice) => {
      const leftSide = slice.classList.contains('left'); // slices 1 & 3
      const media = slice.querySelector('.media');
      const copy  = slice.querySelector('.copy');
      const dx    = leftSide ? -80 : 80;

      if (media) {
        gsap.from(media, {
          x: dx, autoAlpha: 0, duration: SETTINGS.dur, ease: SETTINGS.ease,
          scrollTrigger: { trigger: slice, start: SETTINGS.start, toggleActions: 'play none none reverse' }
        });
      }

      if (copy) {
        gsap.from(copy, {
          x: -dx, autoAlpha: 0, duration: SETTINGS.dur, ease: SETTINGS.ease, delay: 0.1,
          scrollTrigger: { trigger: slice, start: SETTINGS.start, toggleActions: 'play none none reverse' }
        });
      }
    });

    // Refresh once ALL gallery images are loaded (recommended pattern)
    // so ScrollTrigger measures correct start/end. 
    const imgs = Array.from(document.querySelectorAll('.project-casestudy img'));
    let pending = imgs.filter(i => !i.complete).length;
    const refresh = () => ScrollTrigger.refresh();

    if (pending === 0) refresh();
    else imgs.forEach(img => img.addEventListener('load', () => { if (--pending === 0) refresh(); }, { once: true }));

    // Final safety: refresh after full window load too.
    window.addEventListener('load', refresh, { once: true });
  }

  // Respect reduced motion: skip animations completely if requested
  mm.add('(prefers-reduced-motion: reduce)', () => { /* do nothing = no animations */ });

  // Default path: run only when slices exist (Vue has rendered)
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const ready = () => document.querySelector(SELECTOR);
    if (ready()) return init();

    const obs = new MutationObserver(() => { if (ready()) { obs.disconnect(); init(); } });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
})();



function waitForIntroNodes(run) {
  const t0 = performance.now();
  (function check() {
    const nameEl = document.querySelector('[data-anim="name"]');
    const tagEl  = document.querySelector('.intro__tag');
    if (nameEl || tagEl) return run({ nameEl, tagEl });
    if (performance.now() - t0 < 1200) requestAnimationFrame(check);
    else console.warn('[intro] gave up waiting for intro nodes');
  })();
}

function runIntroAnimNow({ nameEl, tagEl }) {
  if (typeof gsap === 'undefined') return;

  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const metaEl = document.querySelector('.intro__meta'); // NEW

  if (reduce) {
    [nameEl, tagEl, metaEl].forEach(el => { if (el) { el.style.opacity = 1; el.style.transform = 'none'; el.style.filter = 'none'; }});
    return;
  }

  // keep your current sets
  if (tagEl)  gsap.set(tagEl,  { opacity: 0, y: 24, filter: 'blur(20px)' });
  if (nameEl) gsap.set(nameEl, { opacity: 0, y: 48, filter: 'blur(12px)', scale: 0.985 });
  if (metaEl) gsap.set(metaEl, { opacity: 0, y: 12, filter: 'blur(8px)' }); // NEW

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.1 });

  // 1) Title first
  if (nameEl) tl.to(nameEl, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.8 });

  // 2) Year + meta together (same position, right after title)
  tl.add('details'); // add AFTER the title tween so it's placed at the end
  if (tagEl)  tl.to(tagEl,  { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 }, 'details');
  if (metaEl) tl.to(metaEl, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.0 }, 'details');
}






// One mount only, matching <div id="app"> in projet.html
app.mount('#project-app');



app.component('carousel-media', {
  props: {
    items: { type: Array, required: true },
    altprefix: { type: String, default: 'Media' }
  },
  data(){ return { i: 0, reduce: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches }; },
  computed:{
    count(){ return this.items?.length || 0; },
    canPrev(){ return this.count > 1; },
    canNext(){ return this.count > 1; },
    label(){ return `Galerie du projet (${this.i+1} / ${this.count})`; }
  },
  methods:{
    prev(){ if (!this.canPrev) return; this.i = (this.i - 1 + this.count) % this.count; },
    next(){ if (!this.canNext) return; this.i = (this.i + 1) % this.count; },
    onKey(e){
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.prev(); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); this.next(); }
    }
  },
  template: `
  <section
    class="media-carousel carousel"
    role="region"
    aria-roledescription="carousel"
    :aria-label="label"
    tabindex="0"
    @keydown="onKey"
  >
    <div class="carousel__viewport" role="group" :aria-label="'Diapositive ' + (i+1) + ' sur ' + count">
      <div class="carousel__track" :style="{ transform: 'translateX(' + (-i*100) + '%)' }">
        <article v-for="(src,idx) in items" :key="src + idx" class="slide" :aria-hidden="idx!==i">
          <img class="slide__img" :src="src" :alt="\`\${altprefix} — image \${idx+1}\`" loading="lazy" decoding="async" />
        </article>
      </div>
    </div>

    <div class="carousel__controls">
      <button class="nav prev" type="button" @click="prev" :disabled="!canPrev" aria-label="Précédent">‹</button>
      <button class="nav next" type="button" @click="next" :disabled="!canNext" aria-label="Suivant">›</button>
    </div>
  </section>
  `
});




document.addEventListener('DOMContentLoaded', () => {
  // 1) Read CSS var BEFORE using it
  const cssHeader = getComputedStyle(document.documentElement)
    .getPropertyValue('--header-h').trim();
  const headerH = parseFloat(cssHeader) || 80;

  // 2) Burger toggle (works on both pages)
  const btn  = document.querySelector('.nav__toggle');
  const menu = document.getElementById('site-menu');

  if (btn && menu) {
    const closeMenu = () => {
      menu.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    };

    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });

    // Close when a link inside the panel is clicked
    menu.addEventListener('click', e => {
      if (e.target.closest('a')) closeMenu();
    });

    // Close on ESC
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
    });

    // Close if we grow past desktop
    const mq = window.matchMedia('(min-width: 1001px)');
    const handleMQ = e => { if (e.matches) closeMenu(); };
    mq.addEventListener ? mq.addEventListener('change', handleMQ)
                        : mq.addListener(handleMQ);
  }

  // 3) Active-link observer (only for same-page anchors)
  const links = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
  const sections = links
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length) {
    const setActive = (id) => {
      links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`));
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, {
      rootMargin: `-${headerH + 8}px 0px -70% 0px`,
      threshold: [0, 0.25, 0.6]
    });

    sections.forEach(sec => io.observe(sec));
  }
});
