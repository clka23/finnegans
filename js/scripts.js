/* ═══════════════════════════════════════════
   LENIS — SMOOTH SCROLL
═══════════════════════════════════════════ */
const lenis = new Lenis({
  duration: 1.4,
  easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Ancres nav → smooth scroll via Lenis
// Utilise la délégation d'événements pour gérer les liens dynamiques
document.addEventListener('click', e => {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;

  e.preventDefault();
  const href = anchor.getAttribute('href');

  // Logo → haut de page
  if (href === '#') {
    lenis.scrollTo(0);
  } else {
    const target = document.querySelector(href);
    if (target) lenis.scrollTo(target, { offset: -70 });
  }

  // Ferme le menu mobile si ouvert
  const navLinks = document.getElementById('nav-links');
  const navbar = document.getElementById('navbar');
  const overlay = document.getElementById('menu-overlay');
  
  if (navLinks) navLinks.classList.remove('open');
  if (navbar) navbar.classList.remove('menu-open');
  if (overlay) overlay.classList.remove('active');
});


/* ═══════════════════════════════════════════
   GSAP — SCROLL TRIGGER
═══════════════════════════════════════════ */
gsap.registerPlugin(ScrollTrigger);

// Parallaxe hero background
gsap.to('.hero-bg', {
  yPercent: 25,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  }
});

// Observer pour ajouter les animations GSAP aux images dynamiquement chargées
const gsapObserver = new MutationObserver(() => {
  document.querySelectorAll('.drink-img-wrap img').forEach(img => {
    // Vérifier si l'image n'a pas déjà un ScrollTrigger
    if (!img.dataset.gsapInit) {
      img.dataset.gsapInit = 'true';
      gsap.fromTo(img,
        { scale: 1.08 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: img,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          }
        }
      );
    }
  });
});

// Observer le conteneur des sections dynamiques
const dynamicSections = document.getElementById('dynamic-sections');
if (dynamicSections) {
  gsapObserver.observe(dynamicSections, { childList: true, subtree: true });
}


/* ═══════════════════════════════════════════
   REVEAL AU SCROLL
═══════════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, 80 * (entry.target.dataset.delay || 0));
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// Observer initial
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// Observer les nouveaux éléments reveal ajoutés dynamiquement
const revealMutationObserver = new MutationObserver(() => {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (!el.closest('#hero')) { // Le hero est déjà visible
      revealObserver.observe(el);
    }
  });
});

// Observer tout le body pour les ajouts dynamiques
revealMutationObserver.observe(document.body, { childList: true, subtree: true });


/* ═══════════════════════════════════════════
   NAVBAR — FOND AU SCROLL
═══════════════════════════════════════════ */
const navbar   = document.getElementById('navbar');
const burger   = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });


/* ═══════════════════════════════════════════
   BURGER MENU
═══════════════════════════════════════════ */
// Overlay pour fermer le menu
const overlay = document.createElement('div');
overlay.id = 'menu-overlay';
document.body.appendChild(overlay);

burger.addEventListener('click', e => {
  e.stopPropagation();
  const isOpen = navLinks.classList.toggle('open');
  navbar.classList.toggle('menu-open');
  overlay.classList.toggle('active', isOpen);
});

overlay.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navbar.classList.remove('menu-open');
  overlay.classList.remove('active');
});

// Ferme aussi via les liens (délégation d'événements pour les liens dynamiques)
navLinks.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    navLinks.classList.remove('open');
    navbar.classList.remove('menu-open');
    overlay.classList.remove('active');
  }
});