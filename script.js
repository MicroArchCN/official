/**
 * MicroArch Official Website — script.js
 * Pure vanilla JS, no frameworks.
 * Handles: nav scroll, mobile menu, fade-in observer,
 *          counter animation, smooth anchors, typing effect.
 */

'use strict';

/* ============================================================
   UTILITY
   ============================================================ */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ============================================================
   NAVIGATION — scroll-triggered glass effect
   ============================================================ */
const nav = qs('#nav');

function handleNavScroll() {
  if (window.scrollY > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}
window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll(); // run on init

/* ============================================================
   MOBILE MENU
   ============================================================ */
const hamburger  = qs('#hamburger');
const mobileMenu = qs('#mobileMenu');

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);

  // Animate hamburger → × shape
  const spans = qsa('span', hamburger);
  if (isOpen) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  }
});

// Close on link click
qsa('.nav__mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    qsa('span', hamburger).forEach(s => {
      s.style.transform = '';
      s.style.opacity   = '';
    });
  });
});

/* ============================================================
   SMOOTH SCROLL — all anchor links
   ============================================================ */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;

  const targetId = link.getAttribute('href');
  if (targetId === '#') return;

  const target = qs(targetId);
  if (!target) return;

  e.preventDefault();
  const navHeight = nav.offsetHeight;
  const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;

  window.scrollTo({ top, behavior: 'smooth' });
});

/* ============================================================
   INTERSECTION OBSERVER — fade-in animations
   ============================================================ */
const fadeEls = qsa('.fade-in');

const fadeObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target); // once is enough
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

fadeEls.forEach(el => fadeObserver.observe(el));

/* ============================================================
   COUNTER ANIMATION — hero stats
   ============================================================ */
const statNumbers = qsa('.stat__number');
let countersStarted = false;

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el, target, duration = 1800) {
  const start    = performance.now();
  const startVal = 0;

  function frame(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOut(progress);
    const current  = Math.round(startVal + (target - startVal) * eased);

    el.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      el.textContent = target;
    }
  }

  requestAnimationFrame(frame);
}

const statsSection = qs('.hero__stats');

const statsObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        statNumbers.forEach((el, i) => {
          const target = parseInt(el.dataset.target, 10);
          const delay  = i * 150;
          setTimeout(() => animateCounter(el, target), delay);
        });
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

if (statsSection) statsObserver.observe(statsSection);

/* ============================================================
   TYPING EFFECT — hero subtitle
   ============================================================ */
(function initTyping() {
  const el = qs('#heroSub');
  if (!el) return;

  const fullText = el.textContent.trim();
  el.textContent = '';
  el.style.borderRight = '2px solid rgba(79,142,247,0.6)';
  el.style.paddingRight = '3px';

  let i = 0;
  const speed = 28; // ms per char

  function type() {
    if (i < fullText.length) {
      el.textContent += fullText.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      // Fade out cursor after done
      setTimeout(() => {
        el.style.transition = 'border-color 0.5s ease';
        el.style.borderColor = 'transparent';
      }, 800);
    }
  }

  // Start after hero badge / headline appear (slight delay)
  setTimeout(type, 900);
})();

/* ============================================================
   PARTICLE CANVAS — subtle floating dots in hero
   ============================================================ */
(function initParticles() {
  const hero = qs('.hero');
  if (!hero) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;
    opacity: 0.35;
  `;
  hero.prepend(canvas);

  const ctx    = canvas.getContext('2d');
  let   width  = 0;
  let   height = 0;
  let   raf    = null;

  const PARTICLE_COUNT = 60;
  const particles = [];

  class Particle {
    constructor() { this.reset(true); }

    reset(initial = false) {
      this.x    = Math.random() * width;
      this.y    = initial ? Math.random() * height : height + 10;
      this.r    = Math.random() * 1.8 + 0.4;
      this.vy   = -(Math.random() * 0.3 + 0.1);
      this.vx   = (Math.random() - 0.5) * 0.15;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 200;

      const palette = [
        [79,  142, 247],
        [0,   212, 255],
        [124, 58,  237],
      ];
      this.color = palette[Math.floor(Math.random() * palette.length)];
    }

    update() {
      this.x    += this.vx;
      this.y    += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y < -10) this.reset();
    }

    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.8;
      const [r, g, b] = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    }
  }

  function resize() {
    width  = canvas.offsetWidth;
    height = canvas.offsetHeight;
    canvas.width  = width;
    canvas.height = height;
  }

  function init() {
    resize();
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle());
    }
    loop();
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => { p.update(); p.draw(); });
    raf = requestAnimationFrame(loop);
  }

  // Pause when tab not visible (perf)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      loop();
    }
  });

  const ro = new ResizeObserver(resize);
  ro.observe(hero);

  init();
})();

/* ============================================================
   SERVICE CARD — magnetic hover tilt effect
   ============================================================ */
qsa('.service-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect     = card.getBoundingClientRect();
    const x        = e.clientX - rect.left;
    const y        = e.clientY - rect.top;
    const centerX  = rect.width  / 2;
    const centerY  = rect.height / 2;
    const rotateX  = ((y - centerY) / centerY) * -4;
    const rotateY  = ((x - centerX) / centerX) *  4;

    card.style.transform = `translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform  = '';
    card.style.transition = 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
  });
});

/* ============================================================
   CASE CARD — parallax image on hover
   ============================================================ */
qsa('.case-card').forEach(card => {
  const img = qs('.case-card__image-bg', card);
  if (!img) return;

  card.addEventListener('mousemove', e => {
    const rect  = card.getBoundingClientRect();
    const x     = (e.clientX - rect.left) / rect.width  - 0.5;
    const y     = (e.clientY - rect.top)  / rect.height - 0.5;
    img.style.transform    = `scale(1.05) translate(${x * 8}px, ${y * 8}px)`;
    img.style.transition   = 'transform 0.1s ease';
  });

  card.addEventListener('mouseleave', () => {
    img.style.transform  = '';
    img.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
  });
});

/* ============================================================
   ACTIVE NAV LINK — highlight current section
   ============================================================ */
const sections  = qsa('section[id]');
const navLinks  = qsa('.nav__link');

function setActiveLink() {
  const scrollY      = window.scrollY;
  const navH         = nav.offsetHeight;

  let currentId = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - navH - 80;
    if (scrollY >= sectionTop) {
      currentId = section.id;
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${currentId}`) {
      link.classList.add('active');
    }
  });
}

window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

/* ============================================================
   TECH BADGE — staggered entrance
   ============================================================ */
(function staggerTechBadges() {
  const badges = qsa('.tech-badge');
  const bObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          badges.forEach((badge, i) => {
            setTimeout(() => {
              badge.style.opacity    = '1';
              badge.style.transform  = 'translateY(0)';
            }, i * 55);
          });
          bObserver.disconnect();
        }
      });
    },
    { threshold: 0.2 }
  );

  // Set initial hidden state
  badges.forEach(badge => {
    badge.style.opacity    = '0';
    badge.style.transform  = 'translateY(20px)';
    badge.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });

  const techSection = qs('.techstack');
  if (techSection) bObserver.observe(techSection);
})();

/* ============================================================
   ARCH NODE — pulsing animation on scroll into view
   ============================================================ */
(function archNodeAnim() {
  const nodes = qsa('.arch-node');

  const aObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          nodes.forEach((node, i) => {
            setTimeout(() => {
              node.style.opacity    = '1';
              node.style.transform  = node.dataset.origTransform || '';
            }, i * 100 + 200);
          });
          aObserver.disconnect();
        }
      });
    },
    { threshold: 0.3 }
  );

  // Cache original transforms
  nodes.forEach(node => {
    node.dataset.origTransform = node.style.transform || '';
    node.style.opacity  = '0';
    node.style.transition = 'opacity 0.5s ease';
  });

  const aboutSection = qs('#about');
  if (aboutSection) aObserver.observe(aboutSection);
})();

/* ============================================================
   FOOTER — fade-in bottom links individually
   ============================================================ */
qsa('.footer__links-group li, .footer__contact-item').forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateX(-10px)';
  el.style.transition = `opacity 0.4s ease ${i * 40}ms, transform 0.4s ease ${i * 40}ms`;

  const fObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateX(0)';
        fObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  fObserver.observe(el);
});

/* ============================================================
   GRADIENT MESH MOUSE TRACKING — subtle hero effect
   ============================================================ */
(function gradientMeshTracking() {
  const hero = qs('.hero');
  if (!hero) return;

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let ticking = false;

  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    targetX = (e.clientX - rect.left) / rect.width;
    targetY = (e.clientY - rect.top)  / rect.height;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateMesh() {
    currentX = lerp(currentX, targetX, 0.04);
    currentY = lerp(currentY, targetY, 0.04);

    const orb1 = qs('.hero__orb--1');
    const orb2 = qs('.hero__orb--2');
    if (orb1 && orb2) {
      orb1.style.transform = `translate(${currentX * 30}px, ${currentY * 20}px)`;
      orb2.style.transform = `translate(${-currentX * 20}px, ${-currentY * 15}px)`;
    }

    requestAnimationFrame(animateMesh);
  }

  animateMesh();
})();

/* ============================================================
   ACTIVE NAV LINK STYLE (via CSS class)
   ============================================================ */
// Inject dynamic active style
const style = document.createElement('style');
style.textContent = `
  .nav__link.active {
    color: var(--text-primary) !important;
  }
  .nav__link.active::after {
    transform: translateX(-50%) scaleX(1) !important;
  }
`;
document.head.appendChild(style);

/* ============================================================
   PREFERS REDUCED MOTION — disable heavy animations
   ============================================================ */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const motionStyle = document.createElement('style');
  motionStyle.textContent = `
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  `;
  document.head.appendChild(motionStyle);
}

/* ============================================================
   CONSOLE BRANDING
   ============================================================ */
console.log(
  '%c微架构 MicroArch%c\n%c深圳市微架构科技有限公司 — Built with passion & code.',
  'color: #4f8ef7; font-size: 22px; font-weight: 900;',
  '',
  'color: #94a3b8; font-size: 13px;'
);
