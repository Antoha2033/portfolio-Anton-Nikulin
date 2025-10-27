// js/projet.js — Vue + fetch a single project by ?proj-id

const { createApp } = Vue;
console.log("page projet");
function getId() {
  const u = new URL(location.href);
  const id = u.searchParams.get('proj-id');
  return id ? Number(id) : NaN;
}

createApp({
  data: () => ({
    loading: true,
    error: '',
    project: null,
  }),

  async mounted() {
    const id = getId();

    try {
      // Adjust the path if needed: 'data/projects.json' vs 'projects.json'
      const res = await fetch('data/projects.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const list = await res.json(); // expects an array of {id, title, year, tags, excerpt, cover, gallery, ...}

      const p = Array.isArray(list) ? list.find(x => Number(x.id) === id) : null;
      if (!p) {
        this.error = `Projet introuvable (${Number.isNaN(id) ? 'id manquant' : 'id ' + id})`;
        return;
      }

      this.project = p;
      document.title = `${p.title} — Portfolio`;
      console.log("bb");
    } catch (e) {
      this.error = `Impossible de charger les projets. ${e.message}`;
      console.error(e);
    } finally {
      this.loading = false;
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
  }
}).mount('#project-app');


