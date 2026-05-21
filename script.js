'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   NAV — scroll glass effect
   ============================================================ */
const nav = qs('#nav');

function handleNavScroll() {
  nav.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll();

/* ============================================================
   MOBILE MENU
   ============================================================ */
const hamburger  = qs('#hamburger');
const mobileMenu = qs('#mobileMenu');

hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', open);
  const [a, b, c] = qsa('span', hamburger);
  if (open) {
    a.style.transform = 'translateY(6.5px) rotate(45deg)';
    b.style.opacity   = '0';
    c.style.transform = 'translateY(-6.5px) rotate(-45deg)';
  } else {
    [a, b, c].forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

qsa('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    qsa('span', hamburger).forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  if (id === '#') return;
  const target = qs(id);
  if (!target) return;
  e.preventDefault();
  const offset = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 12;
  window.scrollTo({ top: offset, behavior: 'smooth' });
});

/* ============================================================
   FADE-IN OBSERVER
   ============================================================ */
const fadeObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -32px 0px' }
);

qsa('.fade-in').forEach(el => fadeObserver.observe(el));

/* ============================================================
   ACTIVE NAV LINK
   ============================================================ */
const sections = qsa('section[id]');
const navLinks = qsa('.nav__link');

function updateActiveLink() {
  const y    = window.scrollY;
  const navH = nav.offsetHeight;
  let active = '';

  sections.forEach(sec => {
    if (y >= sec.offsetTop - navH - 60) active = sec.id;
  });

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${active}`);
  });
}

window.addEventListener('scroll', updateActiveLink, { passive: true });
updateActiveLink();

/* ============================================================
   STACK LAYER — staggered entrance
   ============================================================ */
(function staggerStack() {
  const layers = qsa('.stack-layer, .stack-arrow');
  layers.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = `opacity 0.45s ease ${i * 60}ms, transform 0.45s ease ${i * 60}ms`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        layers.forEach(el => {
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  const stack = qs('.arch-stack');
  if (stack) observer.observe(stack);
})();

/* ============================================================
   ECO CARDS — staggered entrance
   ============================================================ */
(function staggerEcoCards() {
  const cards = qsa('.eco-card');
  cards.forEach((card, i) => {
    card.style.opacity   = '0';
    card.style.transform = 'translateY(16px)';
    card.style.transition = `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(card => {
          card.style.opacity   = '1';
          card.style.transform = 'translateY(0)';
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.1 });

  const grid = qs('.eco-grid');
  if (grid) observer.observe(grid);
})();

/* ============================================================
   PARTNER LOGOS — staggered entrance
   ============================================================ */
(function staggerPartners() {
  const logos = qsa('.partner-logo');
  logos.forEach((el, i) => {
    el.style.opacity   = '0';
    el.style.transition = `opacity 0.4s ease ${i * 50}ms`;
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        logos.forEach(el => { el.style.opacity = '1'; });
        observer.disconnect();
      }
    });
  }, { threshold: 0.2 });

  const grid = qs('.partners-grid');
  if (grid) observer.observe(grid);
})();
