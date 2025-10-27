const { createApp, defineComponent, computed } = Vue;

// 1) read ?proj-id from URL
function getProjectIdFromURL() {
  const url = new URL(window.location.href);
  const v = url.searchParams.get('proj-id'); // per teacher's instructions
  return v ? Number(v) : NaN;                // numeric id
}

// (optional) update title/description
function updateHead({ title, description }) {
  if (title) {
    document.title = `${title} — Portfolio`;
    const h1 = document.getElementById('page-title');
    if (h1) h1.textContent = title;
  }
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
  }
}

// Simple presentational component
const ProjectDetail = defineComponent({
  name: 'ProjectDetail',
  props: { project: { type: Object, required: true } },
  setup(props) {
    const cover    = computed(() => props.project.cover || props.project.image || '');
    const gallery  = computed(() => Array.isArray(props.project.gallery || props.project.images) ? (props.project.gallery || props.project.images) : []);
    const hasGal   = computed(() => gallery.value.length > 0);
    const tech     = computed(() => props.project.tech || props.project.tags || []);
    const links    = computed(() => props.project.links || []);
    const year     = computed(() => props.project.year || props.project.date || '');
    const summary  = computed(() => props.project.excerpt || props.project.summary || props.project.description || '');
    return { cover, gallery, hasGal, tech, links, year, summary };
  },
template: `
  <article class="project">

    <!-- HERO / COVER -->
    <header class="project__hero" v-if="cover">
      <img class="project__cover" :src="cover" :alt="project.title" loading="lazy">
    </header>

    <!-- TITLE + META -->
    <section class="project__header">
      <h2 class="project__title">{{ project.title }}</h2>
      <p class="project__meta">
        <span v-if="year">{{ year }}</span>
        <span v-if="project.role"> · {{ project.role }}</span>
      </p>
      <p class="project__summary" v-if="summary">{{ summary }}</p>
    </section>

    <!-- RICH CONTENT (HTML from JSON) -->
    <section class="project__content" v-if="project.content">
      <div class="project__rich" v-html="project.content"></div>
    </section>

    <!-- TECH TAGS -->
    <section class="project__tech" v-if="tech.length">
      <h3 class="section__title">Technologies</h3>
      <ul class="tags">
        <li class="tags__item" v-for="(t,i) in tech" :key="i">{{ t }}</li>
      </ul>
    </section>

    <!-- GALLERY (images or mixed) -->
    <section class="project__gallery" v-if="hasGal">
      <h3 class="section__title">Galerie</h3>
      <div class="gallery">
        <figure class="gallery__item" v-for="(img,i) in gallery" :key="i">
          <!-- string OR object {src, alt, caption, type} -->
          <template v-if="typeof img === 'string'">
            <img :src="img" :alt="project.title" loading="lazy">
          </template>
          <template v-else>
            <img v-if="!img.type || img.type==='image'"
                 :src="img.src" :alt="img.alt || project.title" loading="lazy">
            <video v-else-if="img.type==='video'" class="gallery__video" controls playsinline preload="metadata">
              <source :src="img.src" type="video/mp4">
            </video>
          </template>
          <figcaption v-if="typeof img!=='string' && img.caption">{{ img.caption }}</figcaption>
        </figure>
      </div>
    </section>

    <!-- LINKS -->
    <section class="project__links" v-if="links.length">
      <h3 class="section__title">Liens</h3>
      <ul class="links">
        <li class="links__item" v-for="(l,i) in links" :key="i">
          <a :href="l.href" target="_blank" rel="noopener">{{ l.label }}</a>
        </li>
      </ul>
    </section>

  </article>
`

});

// 2) Fetch + select by id
createApp({
  components: { ProjectDetail },
  data: () => ({ loading: true, error: '', project: null }),
  async mounted() {
    const id = getProjectIdFromURL(); // e.g., ?proj-id=78
    try {
      const res = await fetch('data/projects.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`); // fetch doesn't reject on 404
      const all = await res.json();
      if (!Array.isArray(all)) throw new Error('projects.json doit contenir un tableau.');

      // find by numeric id
      const idx = all.findIndex(p => Number(p.id) === Number(id));
      if (idx === -1) {
        // if no id provided or not found, you can default to first or show error
        this.error = `Projet introuvable (${Number.isNaN(id) ? 'aucun id fourni' : 'id ' + id})`;
      } else {
        this.project = all[idx];
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
    }
  }
}).mount('#project-app');
