// Briques de mouvement — traduction web du skill « hyperframes-animation ».
// Principes repris du skill : timelines GSAP (seekées par le scroll = scrub), fromTo avec état
// de départ explicite, transforms/opacity uniquement, « smooth beats bouncy » (power3/expo par défaut),
// staggers plafonnés (~0,5 s par groupe), pseudo-aléatoire indexé (jamais Math.random).

const {gsap} = window;

export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Pseudo-aléatoire indexé (rules/particle-burst.md) : pur, déterministe. */
export const prand = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Stagger plafonné : le groupe arrive en un seul temps (rules-index : items × stagger ≤ ~0,5 s). */
export const capStagger = (count, max = 0.07, windowS = 0.5) => Math.min(max, windowS / Math.max(1, count));

/**
 * Ressort amorti en forme close (adapters/gsap-easing-and-stagger.md → Spring Eases).
 * dampingFraction 1 = sans dépassement (défaut maison), 0.8 ≈ ressenti iOS.
 */
export function springEase({response = 0.5, dampingFraction = 1} = {}) {
  const w = (2 * Math.PI) / response;
  const z = dampingFraction;
  let pos;
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    pos = (t) => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + ((z * w) / wd) * Math.sin(wd * t));
  } else {
    pos = (t) => 1 - Math.exp(-w * t) * (1 + w * t);
  }
  const rate = z < 1 ? z * w : w;
  const SCAN = 12 / rate;
  const N = 2400;
  let T = SCAN;
  for (let i = N; i >= 0; i--) {
    const t = (i / N) * SCAN;
    if (Math.abs(1 - pos(t)) > 0.001) {
      T = ((i + 1) / N) * SCAN;
      break;
    }
  }
  const xT = pos(T);
  return {duration: T, ease: (p) => pos(p * T) + p * (1 - xT)};
}

/** Longueur d'un tracé ; repli analytique pour un cercle pas encore rendu (étape masquée). */
export function pathLength(el) {
  let len = 0;
  try {
    len = el.getTotalLength();
  } catch {
    /* élément non rendu : certains navigateurs refusent de mesurer */
  }
  if (!len && el.tagName.toLowerCase() === 'circle') len = 2 * Math.PI * Number(el.getAttribute('r'));
  return len;
}

/** Tracé SVG (rules/svg-path-draw.md) : longueur mesurée, pas devinée. */
export function prepDraw(paths) {
  const list = [...paths];
  for (const p of list) {
    const len = Math.ceil(pathLength(p) * 1.03);
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len}`;
    p.dataset.len = String(len);
  }
  return list;
}

/** Ajoute le tracé à une timeline ; chaque segment démarre à ~75 % du précédent. */
export function drawIn(tl, paths, at = 0, {duration = 0.7, ease = 'power2.out', overlap = 0.75} = {}) {
  prepDraw(paths).forEach((p, i) => {
    tl.fromTo(p, {strokeDashoffset: Number(p.dataset.len)}, {strokeDashoffset: 0, duration, ease}, at + i * duration * overlap);
  });
  return tl;
}

/** Arrivée en cascade (rules/waterfall-entry.md) : opacité binaire, fouet vers le haut, power4.out, chevauchement. */
export function waterfall(tl, els, at = 0, {y = 46, duration = 0.62, gap = 0.07} = {}) {
  [...els].forEach((el, i) => {
    const t = at + i * gap;
    tl.set(el, {opacity: 1}, t);
    tl.fromTo(el, {y: y + (i === 0 ? 20 : 0)}, {y: 0, duration, ease: 'power4.out'}, t);
  });
  return tl;
}

/** Apparition par échelle (rules/spring-pop-entrance.md) : power3.out, pas de rebond. */
export function popIn(tl, els, at = 0, {duration = 0.6, yRise = 18} = {}) {
  const list = [...els];
  const stagger = capStagger(list.length);
  list.forEach((el, i) => {
    tl.fromTo(el, {scale: 0, opacity: 0, y: yRise}, {scale: 1, opacity: 1, y: 0, duration, ease: 'power3.out'}, at + i * stagger);
  });
  return tl;
}

/** Compteur (rules/counting-dynamic-scale.md) : texte via proxy + échelle, même durée, même ease. */
export function countTo(tl, el, to, at = 0, {from = 0, duration = 1.3, ease = 'power3.out', format = (v) => String(Math.round(v)), startScale = 0.7} = {}) {
  const state = {v: from};
  tl.fromTo(
    state,
    {v: from},
    {
      v: to,
      duration,
      ease,
      onUpdate: () => {
        el.textContent = format(state.v);
      },
    },
    at,
  );
  tl.fromTo(el, {scale: startScale}, {scale: 1, duration, ease}, at);
  return tl;
}

/** Balayage de lumière dans le texte (rules/gradient-text-sweep.md) : linéaire, fini. */
export function sweep(tl, el, at = 0, duration = 2.4) {
  tl.fromTo(el, {backgroundPosition: '100% 50%'}, {backgroundPosition: '0% 50%', duration, ease: 'none'}, at);
  return tl;
}

/**
 * Pression de bouton (rules/press-release-spring.md) : compression linéaire,
 * retour ressort ; l'état de départ du retour = l'état d'arrivée de la pression.
 */
export function pressable(el, {pressScale = 0.93} = {}) {
  if (reduced) return;
  const down = () => gsap.to(el, {scale: pressScale, duration: 0.12, ease: 'none', overwrite: 'auto'});
  const up = () => gsap.to(el, {scale: 1, duration: 0.55, ease: 'back.out(1.6)', overwrite: 'auto'});
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointerleave', up);
  el.addEventListener('pointercancel', up);
}

/** Bouton « magnétique » (bureau). */
export function magnetic(el, strength = 0.28) {
  if (reduced || !finePointer) return;
  const xTo = gsap.quickTo(el, 'x', {duration: 0.5, ease: 'power3.out'});
  const yTo = gsap.quickTo(el, 'y', {duration: 0.5, ease: 'power3.out'});
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  });
  el.addEventListener('pointerleave', () => {
    xTo(0);
    yTo(0);
  });
}

/** Inclinaison 3D au survol (inspirée de rules/split-tilt-cards.md), bureau uniquement. */
export function tilt(el, max = 7) {
  if (reduced || !finePointer) return;
  const rx = gsap.quickTo(el, 'rotationX', {duration: 0.6, ease: 'power3.out'});
  const ry = gsap.quickTo(el, 'rotationY', {duration: 0.6, ease: 'power3.out'});
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    ry(((e.clientX - r.left) / r.width - 0.5) * 2 * max);
    rx(-((e.clientY - r.top) / r.height - 0.5) * 2 * max);
  });
  el.addEventListener('pointerleave', () => {
    rx(0);
    ry(0);
  });
}

/**
 * Confettis (rules/particle-burst.md) : réserve fixe créée une fois, paramètres de lancement
 * indexés, UN pilote ease « none » et position = fonction balistique pure du temps.
 */
export function makeBurst(container, {count = 34, palette = ['#b8642f', '#e7c894', '#824314', '#cfa46c', '#fcf8f2'], G = 1250} = {}) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'particle';
    const size = 6 + prand(i * 3 + 1) * 8;
    el.style.width = `${size}px`;
    el.style.height = `${size * 0.62}px`;
    el.style.background = palette[i % palette.length];
    container.appendChild(el);
    const angle = -Math.PI / 2 + (prand(i * 5 + 2) * 2 - 1) * 0.78;
    const speed = 380 + prand(i * 7 + 3) * 420;
    parts.push({el, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: (prand(i * 11 + 4) * 2 - 1) * 620});
  }
  const FLIGHT = 1.35;
  const FADE = 0.3;
  return function play() {
    const drive = {T: 0};
    return gsap.fromTo(
      drive,
      {T: 0},
      {
        T: 1,
        duration: FLIGHT,
        ease: 'none',
        onUpdate: () => {
          const t = drive.T * FLIGHT;
          const fade = Math.min(1, (1 - drive.T) / FADE);
          for (const p of parts) {
            p.el.style.transform = `translate(${p.vx * t}px, ${p.vy * t + 0.5 * G * t * t}px) rotate(${p.spin * t}deg)`;
            p.el.style.opacity = drive.T === 0 || drive.T === 1 ? '0' : String(fade);
          }
        },
      },
    );
  };
}

/**
 * Poussière dorée sur canvas : chaque particule est une fonction pure du temps (graines prand),
 * dessinée seulement quand le canvas est visible.
 */
export function goldDust(canvas, {count = 42, rgb = '207,164,108'} = {}) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  let raf = 0;
  let visible = false;
  const seeds = Array.from({length: count}, (_, i) => ({
    x: prand(i * 3 + 1),
    y: prand(i * 5 + 2),
    r: 0.8 + prand(i * 7 + 3) * 2.2,
    v: 6 + prand(i * 11 + 4) * 16,
    amp: 6 + prand(i * 13 + 5) * 14,
    f: 0.15 + prand(i * 17 + 6) * 0.35,
    ph: prand(i * 19 + 7) * Math.PI * 2,
  }));
  const resize = () => {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  };
  const draw = (ms) => {
    const t = ms / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const s of seeds) {
      const y = (((s.y * h - s.v * t) % h) + h) % h;
      const x = s.x * w + Math.sin(t * s.f * Math.PI * 2 + s.ph) * s.amp;
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.ph * 3));
      const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 4);
      g.addColorStop(0, `rgba(${rgb},${0.75 * tw})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, s.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  const loop = (ms) => {
    draw(ms);
    if (visible) raf = requestAnimationFrame(loop);
  };
  resize();
  window.addEventListener('resize', resize);
  if (reduced) {
    draw(0);
    return;
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  }).observe(canvas);
}
