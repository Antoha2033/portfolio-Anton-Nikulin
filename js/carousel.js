// js/carousel.js
(function () {
    const { createApp, defineComponent, ref, onMounted } = Vue;
  
    const CarouselProjects = defineComponent({
      name: 'CarouselProjects',
      props: { items: { type: Array, required: true } },
      setup(props) {
        const active = ref(-1); // -1 = none (all equal)

        
  
        // accessibility: expand on keyboard focus and arrow keys
        const region = ref(null);
        const setActive = (i) => { active.value = i; };
        const clearActive = () => { active.value = -1; };

        
  

  
        onMounted(() => {
          region.value?.addEventListener('keydown', onKey);
        });
  
        return { active, region, setActive, clearActive };
      },
template: `
  <section
    ref="region"
    class="carousel"
    role="region"
    aria-roledescription="carousel"
    aria-label="Projets (survolez ou utilisez les flèches pour agrandir un projet)"
    tabindex="0"
    @mouseleave="clearActive"
  >
    <div class="carousel__row">
      <article
        v-for="(p,i) in items"
        :key="p.slug || p.id || i"
        class="card"
        :class="{ 'is-active': i === active }"
        @mouseenter="setActive(i)"
        @focusin="setActive(i)"
      >
        <!-- IMPORTANT: bind with :href so Vue evaluates the expression -->
        <a
          class="card__link"
          :href="\`projet.html?proj-id=\${encodeURIComponent(p.id)}\`"
          :data-idx="i"
          :aria-label="\`Voir le projet \${p.title}\`"
        >
          <img class="card__img" :src="p.cover" :alt="p.title" loading="lazy" />
          <div class="card__caption">
            <strong>{{ p.title }}</strong>
            <span v-if="p.tags?.length"> · {{ p.tags[0] }}</span>
          </div>
        </a>
      </article>
    </div>
  </section>
`

    });
  
    // Fetch projects.json and mount
    (async function () {
      try {
        const res = await fetch('data/projects.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const projects = await res.json(); // MDN: Response.json() resolves to data
        // You already loaded Vue via CDN in index.html (Vue Quick Start pattern)
        createApp({ components: { CarouselProjects }, data: () => ({ items: projects }) })
          .mount('#projects-carousel');
      } catch (err) {
        console.error('Chargement des projets échoué:', err);
        const host = document.getElementById('projects-carousel');
        if (host) host.innerHTML = '<p>Impossible de charger la galerie.</p>';
      }
    })();
  })();
  