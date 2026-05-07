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
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
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
    navLinks.classList.remove('open');
    navbar.classList.remove('menu-open');
  });
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

// Scale images au scroll
document.querySelectorAll('.drink-img-wrap img').forEach(img => {
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
});


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

document.querySelectorAll('.drink-card, .menu-category, .event-card, .info-block, .tile').forEach((el, i) => {
  el.dataset.delay = i % 3;
});

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


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
burger.addEventListener('click', e => {
  e.stopPropagation();
  navLinks.classList.toggle('open');
  navbar.classList.toggle('menu-open');
});

// Ferme si clic en dehors du menu
document.addEventListener('click', e => {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      e.target !== burger) {
    navLinks.classList.remove('open');
    navbar.classList.remove('menu-open');
  }
});