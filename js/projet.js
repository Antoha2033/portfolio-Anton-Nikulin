// js/projet.js
// Minimal dynamic project loader for pages at /projet/<slug>.html

(async function () {
    // 1) Get "slug" from the URL path (e.g., /projet/frostpunk.html -> "frostpunk")
    const path = window.location.pathname;              // "/projet/frostpunk.html"
    const slug = path.split('/').pop().replace(/\.html?$/i, '');
  
    // 2) Fetch projects.json (MDN: fetch + response.json())
    //    Make sure the fetch path is correct relative to *this* page (/projet/*).
    try {
      const res = await fetch('../data/projects.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);   // MDN recommends checking .ok
      const projects = await res.json();
  
      // 3) Find the project by slug
      const project = projects.find(p => p.slug === slug);
      if (!project) throw new Error('Projet introuvable: ' + slug);
  
      // 4) Fill the document
      document.title = `${project.title} — Projet`;
      const titleEl = document.getElementById('p-title');
      const metaEl  = document.getElementById('p-meta');
      const coverEl = document.getElementById('p-cover');
      const bodyEl  = document.getElementById('p-body');
  
      if (titleEl) titleEl.textContent = project.title;
      if (metaEl)  metaEl.textContent  = [project.year, ...(project.tags || [])].filter(Boolean).join(' · ');
      if (coverEl) {
        coverEl.src = `../${project.cover}`;
        coverEl.alt = `${project.title} — image de couverture`;
      }
      if (bodyEl)  bodyEl.textContent  = project.excerpt || '';
  
      // 5) Optionally render a small gallery if you have `gallery` in JSON
      const galleryWrap = document.getElementById('p-gallery');
      if (galleryWrap && Array.isArray(project.gallery)) {
        galleryWrap.innerHTML = project.gallery
          .map(src => `<img class="g-img" src="../${src}" alt="${project.title} — visuel">`)
          .join('');
      }
    } catch (err) {
      console.error('Erreur de chargement du projet:', err);
      const main = document.querySelector('main');
      if (main) main.innerHTML = `<p>Impossible de charger ce projet.</p>`;
    }
  })();
  