// js/projet.js
// Uses Vue 3 global build (Vue on window)

const { createApp, defineComponent, computed } = Vue;

/* ---------------- URL + HEAD helpers ---------------- */

function getProjectIdFromURL() {
  const url = new URL(window.location.href);
  const v = url.searchParams.get('proj-id'); // required by your teacher
  return v ? Number(v) : NaN;
}

function updateHead({ title, description }) {
  if (title) {
    document.title = `${title} — Portfolio`;
    const h1 = document.getElementById('page-title');
    if (h1) h1.textContent = title;
  }
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }
}

/* ---------------- Presentational component ---------------- */

const ProjectDetail = defineComponent({
  name: 'ProjectDetail',
  props: { project: { type: Object, required: true } },
  setup(props) {
    // Normalize fields to be tolerant to different JSON shapes
    const cover   = computed(() => props.project.cover || props.project.image || '');
    const year    = computed(() => props.project.year || props.project.date || '');
    const summary = computed(() => props.project.excerpt || props.project.summary || props.project.description || '');
    const tech    = computed(() => props.project.tech || props.project.tags || []);
    const links   = computed(() => props.project.links || []);

    // gallery items can be:
    // - string (image path)
    // - object { src, alt?, caption?, type?='image'|'video', poster? }
    const gallery = computed(() => {
      const g = props.project.gallery || props.project.images || [];
      return Array.isArray(g) ? g : [];
    });
    const hasGallery = computed(() => gallery.value.length > 0);

    return { cover, year, summary, tech, links, gallery, hasGallery };
  },
  template: `
    <article class="project">

      <!-- HERO -->
      <header class="project__hero" v-if="cover">
        <img class="project__cover" :src="cover" :alt="project.title" loading="lazy">
      </header>

      <!-- HEADER -->
      <section class="project__header">
        <h2 class="project__title">{{ project.title }}</h2>
        <p class="project__meta">
          <span v-if="year">{{ year }}</span>
          <span v-if="project.role"> · {{ project.role }}</span>
        </p>
        <p v-if="summary" class="project__summary">{{ summary }}</p>
      </section>

      <!-- RICH BODY (optional HTML from JSON) -->
      <section class="project__content" v-if="project.content">
        <div class="project__rich" v-html="project.content"></div>
      </section>

      <!-- TECH -->
      <section class="project__tech" v-if="tech.length">
        <h3 class="section__title">Technologies</h3>
        <ul class="tags">
          <li v-for="(t,i) in tech" :key="i" class="tags__item">{{ t }}</li>
        </ul>
      </section>

      <!-- GALLERY -->
      <section class="project__gallery" v-if="hasGallery">
        <h3 class="section__title">Galerie</h3>
        <div class="gallery">
          <figure class="gallery__item" v-for="(media,i) in gallery" :key="i">
            <template v-if="typeof media === 'string'">
              <img :src="media" :alt="project.title" loading="lazy">
            </template>
            <template v-else>
              <img v-if="!media.type || media.type==='image'"
                   :src="media.src"
                   :alt="media.alt || project.title"
                   loading="lazy">
              <video v-else-if="media.type==='video'"
                     class="gallery__video"
                     controls
                     playsinline
                     :poster="media.poster || ''"
                     preload="metadata">
                <source :src="media.src" type="video/mp4">
                Votre navigateur ne supporte pas la vidéo HTML5.
              </video>
            </template>
            <figcaption v-if="typeof media !== 'string' && media.caption">{{ media.caption }}</figcaption>
          </figure>
        </div>
      </section>

      <!-- LINKS -->
      <section class="project__links" v-if="links.length">
        <h3 class="section__title">Liens</h3>
        <ul class="links">
          <li v-for="(l,i) in links" :key="i" class="links__item">
            <a :href="l.href" target="_blank" rel="noopener">{{ l.label }}</a>
          </li>
        </ul>
      </section>

    </article>
  `
});

/* ---------------- Root app: fetch + select by ?proj-id ---------------- */

createApp({
  components: { ProjectDetail },
  data: () => ({ loading: true, error: '', project: null }),
  async mounted() {
    const id = getProjectIdFromURL(); // e.g., /projet.html?proj-id=3
    try {
      const res = await fetch('data/projects.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      const list = await res.json();
      if (!Array.isArray(list)) throw new Error('projects.json doit contenir un tableau.');

      const idx = list.findIndex(p => Number(p.id) === Number(id));
      if (idx === -1) {
        this.error = `Projet introuvable (${Number.isNaN(id) ? 'aucun id fourni' : 'id ' + id})`;
      } else {
        this.project = list[idx];
        updateHead({
          title: this.project.title,
          description: this.project.excerpt || this.project.summary || this.project.description || 'Projet'
        });
      }
    } catch (err) {
      this.error = `Impossible de charger les projets. ${err.message}`;
      console.error(err);
    } finally {
      this.loading = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}).mount('#project-app');
