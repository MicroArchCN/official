'use strict';

const qs  = (s, c = document) => c.querySelector(s);
const qsa = (s, c = document) => [...c.querySelectorAll(s)];

/* ================================================================
   PARTICLE CANVAS
   ================================================================ */
(function particles() {
  const canvas = qs('#particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H;
  const COUNT   = 90;
  const LINK_D  = 130;
  const C1 = '0,212,255';
  const C2 = '123,47,255';

  const pts = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkPt() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.5,
      col: Math.random() > 0.55 ? C1 : C2,
    };
  }

  const mouse = { x: -9999, y: -9999 };
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  function frame() {
    ctx.clearRect(0, 0, W, H);

    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d  = Math.hypot(dx, dy);
        if (d < LINK_D) {
          const alpha = (1 - d / LINK_D) * 0.22;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${a.col},${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    pts.forEach(p => {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d  = Math.hypot(dx, dy);
      if (d < 90) {
        const f = (90 - d) / 90 * 0.7;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx *= 0.985;
      p.vy *= 0.985;
      const spd = Math.hypot(p.vx, p.vy);
      if (spd > 1.4) { p.vx = p.vx / spd * 1.4; p.vy = p.vy / spd * 1.4; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.col},0.85)`;
      ctx.shadowColor = `rgba(${p.col},0.6)`;
      ctx.shadowBlur  = 5;
      ctx.fill();
      ctx.shadowBlur  = 0;
    });

    requestAnimationFrame(frame);
  }

  resize();
  for (let i = 0; i < COUNT; i++) pts.push(mkPt());
  window.addEventListener('resize', resize, { passive: true });
  frame();
})();

/* ================================================================
   AMBIENT MUSIC (Web Audio API synth pad)
   ================================================================ */
const audioSystem = (() => {
  let actx, master, started = false, muted = false;

  function build(ac) {
    const mg = ac.createGain();
    mg.gain.setValueAtTime(0, ac.currentTime);
    mg.gain.linearRampToValueAtTime(0.11, ac.currentTime + 4);
    mg.connect(ac.destination);

    const flt = ac.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 700;
    flt.Q.value = 0.4;
    flt.connect(mg);

    // Delay echo
    const dly = ac.createDelay(1.2);
    dly.delayTime.value = 0.65;
    const dfb = ac.createGain(); dfb.gain.value = 0.28;
    const dmx = ac.createGain(); dmx.gain.value = 0.18;
    dly.connect(dfb); dfb.connect(dly);
    dly.connect(dmx); dmx.connect(flt);

    // A-minor chord drone: A1 C2 E2 A2 E3
    [55, 65.4, 82.4, 110, 164.8].forEach((f, i) => {
      const o1 = ac.createOscillator();
      const o2 = ac.createOscillator();
      const gn = ac.createGain();
      o1.type = 'sine';  o1.frequency.value = f;
      o2.type = 'sine';  o2.frequency.value = f * 1.004;
      gn.gain.value = 0.16 / 5;
      o1.connect(gn); o2.connect(gn);
      gn.connect(flt); gn.connect(dly);

      const lfo = ac.createOscillator();
      const lg  = ac.createGain();
      lfo.frequency.value = 0.13 + i * 0.04;
      lg.gain.value = 0.025;
      lfo.connect(lg); lg.connect(gn.gain);

      o1.start(); o2.start(); lfo.start();
    });

    return mg;
  }

  return {
    toggle() {
      if (!started) {
        actx    = new (window.AudioContext || window.webkitAudioContext)();
        master  = build(actx);
        started = true;
        muted   = false;
      } else {
        muted = !muted;
        master.gain.setTargetAtTime(muted ? 0 : 0.11, actx.currentTime, 0.6);
      }
      return !muted;
    },
    isMuted() { return muted; },
    isStarted() { return started; },
  };
})();

const audioBtn = qs('#audioBtn');

function updateAudioBtn(playing) {
  if (!audioBtn) return;
  qs('.audio-icon-on', audioBtn).style.display  = playing ? ''     : 'none';
  qs('.audio-icon-off', audioBtn).style.display = playing ? 'none' : '';
  audioBtn.classList.toggle('playing', playing);
}

if (audioBtn) {
  audioBtn.addEventListener('click', () => {
    const on = audioSystem.toggle();
    updateAudioBtn(on);
  });
}

// Auto-start on first page interaction
function firstTouch() {
  if (audioSystem.isStarted()) return;
  const on = audioSystem.toggle();
  updateAudioBtn(on);
  document.removeEventListener('click',     firstTouch);
  document.removeEventListener('touchstart', firstTouch);
}
document.addEventListener('click',     firstTouch, { once: true });
document.addEventListener('touchstart', firstTouch, { once: true, passive: true });

/* ================================================================
   NAV SCROLL
   ================================================================ */
const nav = qs('#nav');
function syncNav() { nav.classList.toggle('scrolled', window.scrollY > 24); }
window.addEventListener('scroll', syncNav, { passive: true });
syncNav();

/* ================================================================
   MOBILE MENU
   ================================================================ */
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

qsa('.nav__mobile-link').forEach(lnk => {
  lnk.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', false);
    qsa('span', hamburger).forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ================================================================
   SMOOTH SCROLL
   ================================================================ */
document.addEventListener('click', e => {
  const lnk = e.target.closest('a[href^="#"]');
  if (!lnk) return;
  const id = lnk.getAttribute('href');
  if (id === '#') return;
  const tgt = qs(id);
  if (!tgt) return;
  e.preventDefault();
  window.scrollTo({ top: tgt.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 12, behavior: 'smooth' });
});

/* ================================================================
   ACTIVE NAV LINK
   ================================================================ */
const sections = qsa('section[id]');
const navLinks  = qsa('.nav__link');
function syncLinks() {
  const y = window.scrollY, h = nav.offsetHeight;
  let active = '';
  sections.forEach(s => { if (y >= s.offsetTop - h - 60) active = s.id; });
  navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${active}`));
}
window.addEventListener('scroll', syncLinks, { passive: true });
syncLinks();

/* ================================================================
   SCROLL FADE-IN
   ================================================================ */
const fadeObs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); } }),
  { threshold: 0.1, rootMargin: '0px 0px -28px 0px' }
);
qsa('.fade-in').forEach(el => fadeObs.observe(el));

/* ================================================================
   COUNTER ANIMATION
   ================================================================ */
function countUp(el) {
  const target = parseInt(el.dataset.target, 10);
  const suffix = el.dataset.suffix || '';
  if (!target) return;
  const dur = 1800;
  const t0  = performance.now();
  const tick = now => {
    const p  = Math.min((now - t0) / dur, 1);
    const ep = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ep * target) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObs = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); counterObs.unobserve(e.target); } }),
  { threshold: 0.6 }
);
qsa('[data-target]').forEach(el => counterObs.observe(el));

/* ================================================================
   3D TILT ON CARDS
   ================================================================ */
qsa('.cap-card, .case-card, .pain-card, .usp-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width  - 0.5) * 14;
    const y = ((e.clientY - r.top)  / r.height - 0.5) * 14;
    card.style.transform = `perspective(700px) rotateY(${x * 0.4}deg) rotateX(${-y * 0.4}deg) translateY(-4px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});
