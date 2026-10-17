// Page d'accueil : rendu depuis le catalogue + chorégraphie (GSAP, ScrollTrigger, SplitText, Lenis).
// Chaque section = une timeline ; au scroll elle est soit jouée une fois, soit « seekée » (scrub).
import {formatFCFA} from './pricing.mjs';
import {durationsNote, esc, hoursHtml, renderPerks, renderServices} from './render.mjs';
import * as fx from './fx.mjs';
import * as api from './api.mjs';
import {initBooking} from './booking.mjs';

const {gsap, ScrollTrigger, SplitText, CustomEase, Lenis} = window;
gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
CustomEase.create('silk', 'M0,0 C0.22,1 0.36,1 1,1');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const loader = $('.loader');
// Le CSS cache le chargeur après 6 s si le JS échoue ; on coupe ce filet seulement au moment de jouer.
const unlockPage = () => {
  loader.style.animation = 'none';
  document.body.style.animation = 'none';
};

const catalog = window.__CATALOG__ ?? (await (await fetch('data/catalog.json')).json());

// ——— Rendu depuis le catalogue (une seule source pour les prix) ———
// Le serveur écrit déjà ces sections dans la page ; on ne les construit ici que si elles sont vides.
const fill = (sel, html) => {
  const el = $(sel);
  if (!el.textContent.trim()) el.innerHTML = html;
};
fill('[data-perks]', renderPerks(catalog));
fill('[data-services]', renderServices(catalog, {asset: api.asset}));
fill('[data-durations-note]', esc(durationsNote(catalog)));
fill('[data-hours]', hoursHtml(catalog));
$('[data-year]').textContent = String(new Date().getFullYear());

// ——— Défilement doux ———
const lenis = fx.reduced ? null : new Lenis({lerp: 0.1, smoothWheel: true});
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollToTarget = (target) => {
  if (lenis) lenis.scrollTo(target, {offset: -10, duration: 1.4});
  else target.scrollIntoView();
};

// ——— Réservation ———
const health = await api.health();
const booking = initBooking(catalog, {lenis});
booking.setDemo(Object.values(health.payments).includes('demo'));
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-book]');
  if (t) {
    e.preventDefault();
    closeMenu();
    booking.open({service: t.dataset.bookService, mode: t.dataset.bookMode, origin: e.clientX || e.clientY ? {x: e.clientX, y: e.clientY} : null});
    return;
  }
  const a = e.target.closest('a[href^="#"]');
  if (a && a.getAttribute('href').length > 1) {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      closeMenu();
      scrollToTarget(target);
    }
  }
});
const reservationId = new URLSearchParams(location.search).get('reservation');

// ——— Navigation + menu mobile ———
const nav = $('[data-nav]');
const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, {passive: true});
onScroll();
const menu = $('[data-menu]');
const burger = $('[data-burger]');
function closeMenu() {
  if (menu.hidden) return;
  burger.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
  lenis?.start();
}
burger.addEventListener('click', () => {
  if (!menu.hidden) return closeMenu();
  menu.hidden = false;
  burger.setAttribute('aria-expanded', 'true');
  lenis?.stop();
  if (!fx.reduced) {
    const tl = gsap.timeline();
    tl.fromTo(menu, {clipPath: 'circle(0% at 92% 4%)'}, {clipPath: 'circle(150% at 92% 4%)', duration: 0.7, ease: 'expo.inOut'});
    fx.waterfall(tl, $$('a', menu), 0.25, {y: 40, duration: 0.6, gap: 0.06});
  }
});

// ——— Curseur (bureau) ———
if (fx.finePointer && !fx.reduced) {
  document.documentElement.classList.add('has-cursor');
  const dot = $('.cursor__dot');
  const ring = $('.cursor__ring');
  const dx = gsap.quickTo(dot, 'x', {duration: 0.12, ease: 'power3.out'});
  const dy = gsap.quickTo(dot, 'y', {duration: 0.12, ease: 'power3.out'});
  const rx = gsap.quickTo(ring, 'x', {duration: 0.5, ease: 'power3.out'});
  const ry = gsap.quickTo(ring, 'y', {duration: 0.5, ease: 'power3.out'});
  const cursor = $('.cursor');
  // invisible tant que la souris n'a pas bougé (sinon il attend en haut à gauche)
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  window.addEventListener('pointermove', (e) => {
    cursor.classList.add('is-on');
    dx(e.clientX);
    dy(e.clientY);
    rx(e.clientX);
    ry(e.clientY);
  });
  document.addEventListener('pointerover', (e) => {
    const hot = Boolean(e.target.closest('a, button, [data-svc]'));
    gsap.to(ring, {scale: hot ? 1.7 : 1, borderColor: hot ? 'rgba(184,100,47,0.9)' : 'rgba(184,100,47,0.55)', duration: 0.35, ease: 'power3.out'});
    gsap.to(dot, {scale: hot ? 0 : 1, duration: 0.25});
  });
}

// ——— Vidéo ———
const video = $('[data-video]');
const soundBtn = $('[data-sound]');
soundBtn.addEventListener('click', () => {
  video.muted = !video.muted;
  soundBtn.setAttribute('aria-pressed', String(!video.muted));
  soundBtn.textContent = video.muted ? 'Activer le son' : 'Couper le son';
  if (video.paused) video.play().catch(() => {});
});
// commandes visibles sans JavaScript (attribut dans le HTML) ; ici, lecture automatique à l'écran
video.controls = fx.reduced;
if (!fx.reduced) {
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }, {threshold: 0.35}).observe(video);
}

$$('.btn').forEach((b) => fx.pressable(b));
$$('[data-magnetic]').forEach((b) => fx.magnetic(b));
$$('.svc').forEach((c) => fx.tilt(c, 6));
fx.goldDust($('[data-dust]'));

await document.fonts.ready;

// une animation qui échoue ne doit jamais bloquer la réservation
const safely = (fn) => {
  try {
    fn();
  } catch (err) {
    console.error(err);
  }
};

// Retour de Wave / Orange Money : pas de logo d'ouverture, la confirmation s'affiche tout de suite.
// Mouvement réduit, ou chargement si lent que le filet CSS a déjà ouvert la page : pas de logo non plus.
if (fx.reduced || reservationId || performance.now() > 5500) {
  unlockPage();
  loader.remove();
  document.body.classList.remove('is-loading');
  if (reservationId) booking.openStatus(reservationId);
  if (fx.reduced) safely(staticState);
  else {
    safely(intro);
    safely(choreography);
  }
} else {
  await playLoader();
  safely(intro);
  safely(choreography);
}
// la fenêtre de réservation masque la barre de défilement : on recale les déclencheurs en la fermant
$('[data-booking]').addEventListener('booking:closed', () => ScrollTrigger.refresh());

// ——— Chargement : le logo de l'enseigne s'assemble (blueprint logo-assemble-lockup) ———
function playLoader() {
  unlockPage();
  return new Promise((resolve) => {
    let seen = false;
    try {
      seen = sessionStorage.getItem('cc-seen') === '1';
      sessionStorage.setItem('cc-seen', '1');
    } catch {
      /* navigation privée */
    }
    const logo = $('[data-logo]', loader);
    const row = [...$('.cl-row', logo).children].flatMap((el) => (el.classList.contains('cl-t') ? [el.firstElementChild] : [el]));
    const s = $('.cl-s', logo);
    const vert = $$('.cl-v span', logo);
    gsap.set([...row, s, ...vert], {opacity: 0});
    const tl = gsap.timeline({onComplete: resolve});
    fx.drawIn(tl, $$('.loader__arch path'), 0.05, {duration: 1.3, ease: 'power2.inOut'});
    fx.waterfall(tl, row, 0.25, {y: 60, duration: 0.55, gap: 0.065});
    tl.fromTo(s, {opacity: 0, y: -50}, {opacity: 1, y: 0, duration: 0.55, ease: 'power4.out'}, 0.85);
    vert.forEach((el, i) => tl.fromTo(el, {opacity: 0, y: -36}, {opacity: 1, y: 0, duration: 0.5, ease: 'power4.out'}, 0.95 + i * 0.07));
    tl.to(loader, {yPercent: -100, duration: 0.95, ease: 'expo.inOut'}, '+=0.3');
    tl.add(() => document.body.classList.remove('is-loading'), '-=0.6');
    tl.set(loader, {display: 'none'});
    if (seen) tl.timeScale(2.2);
  });
}

// ——— Hero (blueprint titlecard-reveal + rules waterfall / svg-path-draw / spring-pop / gradient-text-sweep) ———
function intro() {
  const tl = gsap.timeline();
  tl.fromTo('[data-hero-line]', {yPercent: 115}, {yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.14}, 0);
  tl.fromTo('.hero .eyebrow', {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'}, 0.05);
  fx.sweep(tl, $('[data-sweep]'), 0.35, 2.6);
  tl.fromTo('[data-hero-fade]', {opacity: 0, y: 26}, {opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1}, 0.5);
  fx.drawIn(tl, $$('.arch-line [data-draw]'), 0.1, {duration: 1.7, ease: 'power2.inOut'});
  tl.fromTo('[data-hero-arch]', {clipPath: 'inset(100% 0% 0% 0%)'}, {clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'expo.inOut'}, 0.15);
  tl.fromTo('[data-hero-img]', {scale: 1.38}, {scale: 1.1, duration: 2.4, ease: 'expo.out'}, 0.15);
  tl.fromTo('.hero__glow', {opacity: 0, scale: 0.8}, {opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out'}, 0.3);
  fx.popIn(tl, $$('[data-chip]'), 1.05);
  tl.fromTo('.scroll-cue', {opacity: 0}, {opacity: 1, duration: 0.6}, 1.6);
  // respiration des pastilles (rules/sine-wave-loop.md), phases décalées par index
  $$('[data-chip]').forEach((c, i) => gsap.to(c, {y: -10, duration: 2.2 + i * 0.35, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8 + i * 0.2}));
  gsap.to('.scroll-cue span', {y: 12, opacity: 0, duration: 1.4, ease: 'power2.in', repeat: -1, delay: 2});

  // parallaxe au scroll (timeline seekée par le scroll)
  gsap
    .timeline({scrollTrigger: {trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true}})
    .to('.hero__visual', {yPercent: 14, ease: 'none'}, 0)
    .to('[data-hero-img]', {yPercent: 7, ease: 'none'}, 0)
    .to('.hero__copy', {yPercent: -12, opacity: 0.15, ease: 'none'}, 0)
    .to('.chip--a', {yPercent: -140, ease: 'none'}, 0)
    .to('.chip--b', {yPercent: -70, ease: 'none'}, 0)
    .to('.chip--c', {yPercent: -220, ease: 'none'}, 0);
}

function choreography() {
  // Bandeau : boucle infinie, accélérée et inclinée par la vitesse de scroll
  const track = $('.marquee__track');
  const loop = gsap.to(track, {xPercent: -50, duration: 28, ease: 'none', repeat: -1});
  const skew = gsap.quickTo(track, 'skewX', {duration: 0.5, ease: 'power3.out'});
  ScrollTrigger.create({
    trigger: '[data-marquee]',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      const v = self.getVelocity();
      skew(gsap.utils.clamp(-10, 10, v / -260));
      gsap.to(loop, {timeScale: 1 + Math.min(5, Math.abs(v) / 500), duration: 0.2, overwrite: true, onComplete: () => gsap.to(loop, {timeScale: 1, duration: 1.2})});
    },
  });

  // Titres de section : mots en cascade (rules/waterfall-entry.md)
  $$('[data-reveal-title]').forEach((el) => {
    const split = new SplitText(el, {type: 'words', wordsClass: 'w'});
    gsap.set(split.words, {opacity: 0});
    const tl = gsap.timeline({scrollTrigger: {trigger: el, start: 'top 86%', toggleActions: 'play none none none'}});
    fx.waterfall(tl, split.words, 0, {y: 54, duration: 0.75, gap: fx.capStagger(split.words.length, 0.07, 0.55)});
  });
  $$('[data-reveal]').forEach((el) =>
    gsap.fromTo(el, {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: {trigger: el, start: 'top 90%', toggleActions: 'play none none none'}}),
  );

  // Semaine : les capsules MAR → VEN se remplissent, SAM/DIM se barrent
  const week = $('[data-week]');
  week.querySelectorAll('li').forEach((li) => {
    li.insertAdjacentHTML('afterbegin', '<span class="fill" aria-hidden="true"></span>');
    if (li.dataset.day === 'we') li.insertAdjacentHTML('beforeend', '<span class="strike" aria-hidden="true"></span>');
  });
  gsap.set(week.querySelectorAll('.strike'), {rotation: -58, scaleX: 0});
  const wtl = gsap.timeline({scrollTrigger: {trigger: week, start: 'top 80%', toggleActions: 'play none none none'}});
  fx.popIn(wtl, week.children, 0, {duration: 0.6, yRise: 26});
  week.querySelectorAll('[data-day="on"]').forEach((li, i) => {
    wtl.fromTo(li.querySelector('.fill'), {scaleY: 0}, {scaleY: 1, duration: 0.6, ease: 'power3.inOut'}, 0.6 + i * 0.15);
    wtl.to(li, {color: '#fcf8f2', borderColor: 'rgba(130,67,20,0)', duration: 0.3}, 0.82 + i * 0.15);
  });
  week.querySelectorAll('[data-day="we"]').forEach((li, i) => {
    wtl.to(li.querySelector('.strike'), {scaleX: 1, duration: 0.45, ease: 'power2.out'}, 1.45 + i * 0.12);
    wtl.to(li, {opacity: 0.45, duration: 0.4}, 1.55 + i * 0.12);
  });
  wtl.to(week.querySelector('[data-day="off"]'), {opacity: 0.5, duration: 0.4}, 1.4);

  // Avantages : cartes + pictos tracés (rules/svg-path-draw.md)
  $$('.perk').forEach((card, i) => {
    const tl = gsap.timeline({scrollTrigger: {trigger: card, start: 'top 88%', toggleActions: 'play none none none'}, delay: (i % 4) * 0.08});
    tl.fromTo(card, {opacity: 0, y: 40}, {opacity: 1, y: 0, duration: 0.8, ease: 'power3.out'}, 0);
    fx.drawIn(tl, card.querySelectorAll('svg path'), 0.2, {duration: 0.6});
  });

  // Tarifs : assemblage en profondeur (rules/depth-scatter-assemble.md) + compteurs (counting-dynamic-scale)
  $$('.svc').forEach((card, i) => {
    const r1 = fx.prand(i * 3 + 1);
    const r2 = fx.prand(i * 7 + 2);
    gsap.fromTo(
      card,
      {opacity: 0, y: 90 + r1 * 70, rotationX: -24, rotationZ: (r2 - 0.5) * 10, z: -180},
      {opacity: 1, y: 0, rotationX: 0, rotationZ: 0, z: 0, duration: 1.15, ease: 'expo.out', delay: (i % 3) * 0.07, scrollTrigger: {trigger: card, start: 'top 94%', toggleActions: 'play none none none'}},
    );
    const price = $('[data-price]', card);
    const tl = gsap.timeline({scrollTrigger: {trigger: card, start: 'top 82%', toggleActions: 'play none none none'}});
    fx.countTo(tl, price, Number(price.dataset.price), 0.25, {duration: 1.3, format: (v) => formatFCFA(v, {suffix: ''}), startScale: 0.6});
    const badge = $('.svc__badge', card);
    if (badge) tl.fromTo(badge, {scale: 0, rotation: -40}, {scale: 1, rotation: 8, duration: 0.7, ease: 'back.out(1.7)'}, 0.9);
  });

  // Réalisations : défilement horizontal épinglé ; parallaxe interne de chaque arche
  const trackEl = $('[data-track]');
  const dist = () => Math.max(0, trackEl.scrollWidth - window.innerWidth);
  const htween = gsap.to(trackEl, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: {trigger: '[data-gallery]', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1},
  });
  $$('.shot').forEach((shot) => {
    gsap.fromTo($('img', shot), {xPercent: -7}, {xPercent: 7, ease: 'none', scrollTrigger: {trigger: shot, containerAnimation: htween, start: 'left right', end: 'right left', scrub: true}});
    gsap.fromTo($('figcaption', shot), {opacity: 0, y: 24}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: {trigger: shot, containerAnimation: htween, start: 'left 80%', toggleActions: 'play none none reverse'}});
  });

  // Expérience : vapeur au-dessus des tasses, coches tracées, citation écrite
  gsap.fromTo('.experience__visual', {yPercent: 8}, {yPercent: -8, ease: 'none', scrollTrigger: {trigger: '.experience', start: 'top bottom', end: 'bottom top', scrub: true}});
  // chaque volute : le trait monte depuis la tasse puis s'en détache ; l'opacité culmine quand le trait est entier
  const steamTl = gsap.timeline({paused: true});
  fx.prepDraw($$('[data-steam] path')).forEach((p, i) => {
    const len = Number(p.dataset.len);
    const wisp = gsap.timeline({repeat: -1});
    wisp.fromTo(p, {strokeDashoffset: len, y: 8}, {strokeDashoffset: -len, y: -16, duration: 3.4, ease: 'sine.inOut'}, 0);
    wisp.fromTo(p, {opacity: 0}, {opacity: 0.85, duration: 1.1, ease: 'sine.out'}, 0.3);
    wisp.to(p, {opacity: 0, duration: 1.1, ease: 'sine.in'}, 2.3);
    steamTl.add(wisp, i * 1.1);
  });
  ScrollTrigger.create({trigger: '[data-steam-scene]', start: 'top bottom', end: 'bottom top', onToggle: (self) => (self.isActive ? steamTl.play() : steamTl.pause())});
  const tickTl = gsap.timeline({scrollTrigger: {trigger: '[data-ticks]', start: 'top 85%', toggleActions: 'play none none none'}});
  $$('[data-ticks] li').forEach((li, i) => {
    tickTl.fromTo(li, {opacity: 0, x: -20}, {opacity: 1, x: 0, duration: 0.6, ease: 'power3.out'}, i * 0.12);
    fx.drawIn(tickTl, li.querySelectorAll('path'), 0.15 + i * 0.12, {duration: 0.45});
  });
  gsap.fromTo('.frame-quote', {clipPath: 'inset(-20% 100% -20% 0%)'}, {clipPath: 'inset(-20% 0% -20% 0%)', duration: 1.6, ease: 'power2.inOut', scrollTrigger: {trigger: '.frame-quote', start: 'top 90%', toggleActions: 'play none none none'}});

  // Salon / domicile : cartes inclinées en miroir (rules/split-tilt-cards.md), pictos tracés
  $$('[data-duo]').forEach((card, i) => {
    const side = i === 0 ? -1 : 1;
    const tl = gsap.timeline({scrollTrigger: {trigger: card, start: 'top 85%', toggleActions: 'play none none none'}});
    tl.fromTo(card, {opacity: 0, x: 70 * side, rotationY: -16 * side, transformPerspective: 1200}, {opacity: 1, x: 0, rotationY: 0, duration: 1.1, ease: 'expo.out'}, i * 0.1);
    fx.drawIn(tl, card.querySelectorAll('[data-draw]'), 0.35 + i * 0.1, {duration: 0.7});
    fx.tilt(card, 4);
  });

  // Vidéo : le téléphone pivote avec le scroll (blueprint device-surface-showcase)
  gsap.fromTo(
    '.phone',
    {rotationY: 26, rotationX: 12, y: 60},
    {rotationY: -10, rotationX: 0, y: -40, ease: 'none', scrollTrigger: {trigger: '.pub', start: 'top bottom', end: 'bottom top', scrub: true}},
  );

  // Réserver : anneau 30 % + compteur (rules/stat-bars-and-fills + counting-dynamic-scale, même durée/ease)
  const ring = $('[data-ring-fill]');
  const len = fx.pathLength(ring);
  ring.style.strokeDasharray = `${len}`;
  ring.style.strokeDashoffset = `${len}`;
  const rtl = gsap.timeline({scrollTrigger: {trigger: '[data-ring]', start: 'top 82%', toggleActions: 'play none none none'}});
  rtl.to(ring, {strokeDashoffset: len * 0.7, duration: 1.7, ease: 'power3.out'}, 0);
  fx.countTo(rtl, $('[data-ring-count]'), 30, 0, {duration: 1.7, startScale: 0.6});
  $$('[data-howto] li').forEach((li, i) => rtl.fromTo(li, {opacity: 0, y: 26}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out'}, 0.3 + i * 0.12));

  // Pied de page : le logo en croix se reconstruit
  const flogo = $('.footer .cross-logo');
  const fl = [...$('.cl-row', flogo).children].flatMap((el) => (el.classList.contains('cl-t') ? [el.firstElementChild] : [el]));
  const ftl = gsap.timeline({scrollTrigger: {trigger: flogo, start: 'top 90%', toggleActions: 'play none none none'}});
  gsap.set([...fl, $('.cl-s', flogo), ...$$('.cl-v span', flogo)], {opacity: 0});
  fx.waterfall(ftl, fl, 0, {y: 40, duration: 0.5, gap: 0.05});
  ftl.fromTo($('.cl-s', flogo), {opacity: 0, y: -30}, {opacity: 1, y: 0, duration: 0.5, ease: 'power4.out'}, 0.45);
  $$('.cl-v span', flogo).forEach((el, i) => ftl.fromTo(el, {opacity: 0, y: -26}, {opacity: 1, y: 0, duration: 0.45, ease: 'power4.out'}, 0.55 + i * 0.06));

  ScrollTrigger.refresh();
}

/** Mouvement réduit : tout est affiché dans son état final, sans animation. */
function staticState() {
  const week = $('[data-week]');
  week.querySelectorAll('[data-day="on"]').forEach((li) => {
    li.insertAdjacentHTML('afterbegin', '<span class="fill" aria-hidden="true"></span>');
    gsap.set(li.querySelector('.fill'), {scaleY: 1});
    li.style.color = '#fcf8f2';
  });
  week.querySelectorAll('[data-day="we"], [data-day="off"]').forEach((li) => (li.style.opacity = '0.5'));
  const ring = $('[data-ring-fill]');
  const len = fx.pathLength(ring);
  ring.style.strokeDasharray = `${len}`;
  ring.style.strokeDashoffset = `${len * 0.7}`;
  $('[data-ring-count]').textContent = '30';
  $$('[data-steam] path').forEach((p) => (p.style.opacity = '0.6'));
}
