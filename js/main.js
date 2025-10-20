// Add .js class once JS is running (progressive enhancement)
document.documentElement.classList.add('js');

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('DOMContentLoaded', () => {
  const nameEl = document.querySelector('[data-anim="name"]');
  const cues   = document.querySelectorAll('.cue');

  // No GSAP or reduced motion → show static
  if (reduce || typeof gsap === 'undefined') {
    nameEl && (nameEl.style.opacity = 1, nameEl.style.transform = 'none');
    cues.forEach(c => (c.style.opacity = 1, c.style.transform = 'none'));
    return;
  }

  // Timeline: name in → cues in (stagger) → gentle bob forever
  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

  tl.fromTo(nameEl, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9 });

  tl.fromTo(
    cues,
    { opacity: 0, y: -8 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.15 },
    '+=0.8'
  );

  tl.to(
    cues,
    { y: 12, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' },
    '>-0.1'
  );
});
