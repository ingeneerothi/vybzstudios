// Tunnel de réservation : prestation -> lieu -> créneau -> coordonnées -> acompte 30 % -> statut.
import {QuoteError, formatDuration, formatFCFA, quote} from './pricing.mjs';
import {calendarDays, formatDateLong, toHHMM, toMin} from './slots.mjs';
import {normalizePhoneCI} from './phone.mjs';
import * as api from './api.mjs';
import * as fx from './fx.mjs';

const {gsap} = window;
const STEP_TITLES = {1: 'Votre prestation', 2: 'Au salon ou chez vous ?', 3: 'Votre créneau', 4: 'Vos coordonnées', 5: 'Acompte de 30 %', status: 'Votre réservation'};
const METHOD = {wave: 'Wave', orange: 'Orange Money'};
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);
const CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>';
const MONTHS = new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric', timeZone: 'UTC'});

export function initBooking(catalog, {lenis} = {}) {
  const root = document.querySelector('[data-booking]');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const ui = {
    iris: $('[data-iris]'),
    panel: $('[data-panel]'),
    title: $('[data-step-title]'),
    progress: $('[data-progress]'),
    stepLabels: $$('[data-steps] li'),
    body: $('.booking__body'),
    bar: $('[data-bar]'),
    total: $('[data-bar-total]'),
    dur: $('[data-bar-dur]'),
    deposit: $('[data-bar-deposit]'),
    back: $('[data-back]'),
    next: $('[data-next]'),
    error: $('[data-error]'),
    status: $('[data-status]'),
    demoBadge: $('[data-demo-badge]'),
  };
  const playBurst = fx.makeBurst($('[data-burst]'));
  const wa = (text) => `https://wa.me/${catalog.salon.whatsapp}?text=${encodeURIComponent(text)}`;

  const fresh = () => ({
    step: 1,
    services: new Map(),
    student: false,
    mode: null,
    zone: catalog.homeService.zones[0]?.id ?? null,
    address: '',
    landmark: '',
    date: null,
    time: null,
    name: '',
    phone: '',
    email: '',
    notes: '',
    method: null,
    consent: false,
    month: null,
  });
  let state = fresh();
  let isOpen = false;
  let busy = false;
  let lastFocus = null;
  let shownTotal = 0;

  const selection = () => ({services: [...state.services.values()], student: state.student, mode: state.mode ?? 'salon', zone: state.zone});
  const currentQuote = () => {
    if (!state.services.size) return null;
    try {
      return quote(catalog, selection());
    } catch (e) {
      if (e instanceof QuoteError) return null;
      throw e;
    }
  };

  // ——— Étape 1 : prestations ———
  const pickList = $('[data-pick-services]');
  pickList.innerHTML = catalog.services
    .map(
      (s) => `<div class="pick-row" data-row="${esc(s.id)}">
  <button type="button" class="pick" data-id="${esc(s.id)}" aria-pressed="false">
    <span class="pick__img"><img src="img/${esc(s.img)}-640.webp" alt="" loading="lazy" style="object-position:${esc(s.focus ?? '50% 50%')}"></span>
    <span><span class="pick__name">${esc(s.name)}</span><span class="pick__meta">${s.note ? `${esc(s.note)} · ` : ''}≈ ${formatDuration(s.durationMin)}</span></span>
    <span class="pick__price">${formatFCFA(s.price)}<span class="tick">${CHECK}</span></span>
  </button>
  ${s.options ? `<div class="options" hidden role="group" aria-label="Option ${esc(s.name)}">${s.options.map((o) => `<button type="button" data-option="${esc(o)}" aria-pressed="false">${esc(o)}</button>`).join('')}</div>` : ''}
</div>`,
    )
    .join('');

  const studentWrap = $('[data-student-wrap]');
  const studentBox = $('[data-student]');

  function syncPicks() {
    for (const row of $$('[data-row]')) {
      const id = row.dataset.row;
      const sel = state.services.get(id);
      const btn = row.querySelector('.pick');
      btn.classList.toggle('is-on', Boolean(sel));
      btn.setAttribute('aria-pressed', String(Boolean(sel)));
      const opts = row.querySelector('.options');
      if (opts) {
        opts.hidden = !sel;
        for (const o of opts.querySelectorAll('button')) o.setAttribute('aria-pressed', String(sel?.option === o.dataset.option));
      }
    }
    const eligible = [...state.services.keys()].some((id) => catalog.studentDiscount.eligible.includes(id));
    studentWrap.hidden = !eligible;
    if (!eligible) state.student = false;
    studentBox.checked = state.student;
  }

  pickList.addEventListener('click', (e) => {
    showError(null);
    const opt = e.target.closest('[data-option]');
    if (opt) {
      const id = opt.closest('[data-row]').dataset.row;
      state.services.set(id, {id, option: opt.dataset.option});
      syncPicks();
      updateBar();
      return;
    }
    const btn = e.target.closest('.pick');
    if (!btn) return;
    const id = btn.dataset.id;
    if (state.services.has(id)) state.services.delete(id);
    else {
      state.services.set(id, {id});
      if (!fx.reduced) {
        const tl = gsap.timeline();
        fx.drawIn(tl, btn.querySelectorAll('.tick path'), 0, {duration: 0.35});
        const opts = btn.parentElement.querySelector('.options');
        if (opts) tl.fromTo(opts, {opacity: 0, y: -8}, {opacity: 1, y: 0, duration: 0.35, ease: 'power3.out'}, 0.05);
      }
    }
    state.date = null;
    state.time = null;
    syncPicks();
    updateBar();
  });
  pickList.querySelectorAll('.pick').forEach((b) => fx.pressable(b, {pressScale: 0.97}));
  studentBox.addEventListener('change', () => {
    state.student = studentBox.checked;
    updateBar();
  });

  // ——— Étape 2 : lieu ———
  const zoneSel = $('[data-zone]');
  zoneSel.innerHTML = catalog.homeService.zones.map((z) => `<option value="${esc(z.id)}">${esc(z.name)}${typeof z.fee === 'number' ? ` · ${formatFCFA(z.fee)}` : ''}</option>`).join('');
  $('[data-home-note]').textContent = catalog.homeService.note;
  const homeFields = $('[data-home-fields]');
  $$('[data-mode]').forEach((b) => {
    fx.pressable(b, {pressScale: 0.97});
    b.addEventListener('click', () => {
      showError(null);
      const wasHome = state.mode === 'domicile';
      state.mode = b.dataset.mode;
      syncPlace();
      if (state.mode === 'domicile' && !wasHome && !fx.reduced) {
        gsap.fromTo(homeFields.children, {opacity: 0, y: 18}, {opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06});
      }
      if (!fx.reduced) fx.drawIn(gsap.timeline(), b.querySelectorAll('path, circle'), 0, {duration: 0.5});
      updateBar();
    });
  });
  function syncPlace() {
    $$('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
    homeFields.hidden = state.mode !== 'domicile';
    zoneSel.value = state.zone ?? '';
  }
  zoneSel.addEventListener('change', () => {
    state.zone = zoneSel.value;
    updateBar();
  });
  $('[data-address]').addEventListener('input', (e) => (state.address = e.target.value));
  $('[data-landmark]').addEventListener('input', (e) => (state.landmark = e.target.value));

  // ——— Étape 3 : calendrier + créneaux ———
  const grid = $('[data-cal-grid]');
  const monthLabel = $('[data-cal-month]');
  const slotsWrap = $('[data-slots-wrap]');
  const slotsGrid = $('[data-slots]');
  let days = [];
  let months = [];

  function renderCalendar(animate = true) {
    days = calendarDays(catalog);
    months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
    if (!state.month || !months.includes(state.month)) state.month = (state.date ?? days.find((d) => d.bookable)?.date ?? days[0].date).slice(0, 7);
    const [y, m] = state.month.split('-').map(Number);
    monthLabel.textContent = MONTHS.format(new Date(Date.UTC(y, m - 1, 1)));
    $('[data-cal-prev]').disabled = months.indexOf(state.month) <= 0;
    $('[data-cal-next]').disabled = months.indexOf(state.month) >= months.length - 1;
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const byDate = new Map(days.map((d) => [d.date, d]));
    let html = '<span></span>'.repeat(lead);
    for (let d = 1; d <= last; d++) {
      const date = `${state.month}-${String(d).padStart(2, '0')}`;
      const info = byDate.get(date);
      const open = info?.bookable;
      html += open
        ? `<button type="button" class="day is-open${state.date === date ? ' is-selected' : ''}" data-date="${date}" aria-label="${esc(formatDateLong(date))}" aria-pressed="${state.date === date}">${d}</button>`
        : `<span class="day" aria-hidden="true">${d}</span>`;
    }
    grid.innerHTML = html;
    if (animate && !fx.reduced) {
      const cells = grid.querySelectorAll('.day');
      gsap.fromTo(cells, {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: fx.capStagger(cells.length, 0.012, 0.4)});
    }
  }

  $('[data-cal-prev]').addEventListener('click', () => {
    state.month = months[Math.max(0, months.indexOf(state.month) - 1)];
    renderCalendar();
  });
  $('[data-cal-next]').addEventListener('click', () => {
    state.month = months[Math.min(months.length - 1, months.indexOf(state.month) + 1)];
    renderCalendar();
  });
  grid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-date]');
    if (!b) return;
    showError(null);
    state.date = b.dataset.date;
    state.time = null;
    grid.querySelectorAll('.day').forEach((d) => {
      d.classList.toggle('is-selected', d === b);
      if (d.dataset.date) d.setAttribute('aria-pressed', String(d === b));
    });
    if (!fx.reduced) gsap.fromTo(b, {scale: 0.7}, {scale: 1, duration: 0.5, ease: 'power3.out'});
    loadSlots();
    updateBar();
  });

  async function loadSlots() {
    const q = currentQuote();
    if (!state.date || !q) {
      slotsWrap.hidden = true;
      return;
    }
    slotsWrap.hidden = false;
    $('[data-slots-title]').textContent = `${formatDateLong(state.date)} · durée ≈ ${formatDuration(q.durationMin)}`;
    slotsGrid.innerHTML = '<p class="note">Recherche des créneaux…</p>';
    let slots = [];
    try {
      slots = await api.availability(catalog, state.date, q.durationMin);
    } catch (e) {
      slotsGrid.innerHTML = `<p class="note">${esc(e.message)}</p>`;
      return;
    }
    if (!slots.some((s) => s.available)) {
      slotsGrid.innerHTML = `<p class="note">Plus de créneau libre ce jour-là pour cette durée. Choisissez une autre date ou <a href="${wa('Bonjour ! Je souhaite réserver une prestation, auriez-vous un créneau ?')}" target="_blank" rel="noopener">écrivez-nous sur WhatsApp</a>.</p>`;
      return;
    }
    slotsGrid.innerHTML = slots
      .map((s) => `<button type="button" class="slot" data-time="${s.time}" aria-pressed="${state.time === s.time}" ${s.available ? '' : 'disabled'} aria-label="${s.time} à ${s.end}">${s.time}</button>`)
      .join('');
    if (!fx.reduced) fx.waterfall(gsap.timeline(), slotsGrid.querySelectorAll('.slot'), 0, {y: 22, duration: 0.5, gap: fx.capStagger(slots.length, 0.03, 0.45)});
  }
  slotsGrid.addEventListener('click', (e) => {
    const b = e.target.closest('[data-time]');
    if (!b || b.disabled) return;
    showError(null);
    state.time = b.dataset.time;
    slotsGrid.querySelectorAll('.slot').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    if (!fx.reduced) gsap.fromTo(b, {scale: 0.9}, {scale: 1, duration: 0.45, ease: 'back.out(1.6)'});
    updateBar();
  });

  // ——— Étape 4 : coordonnées ———
  const bindField = (sel, key) => $(sel).addEventListener('input', (e) => {
    state[key] = e.target.value;
    e.target.closest('.field')?.classList.remove('is-invalid');
  });
  bindField('[data-name]', 'name');
  bindField('[data-phone]', 'phone');
  bindField('[data-email]', 'email');
  bindField('[data-notes]', 'notes');

  // ——— Étape 5 : ticket + paiement ———
  $('[data-policy]').textContent = `J’accepte de régler 30 % d’acompte maintenant. ${catalog.policy.deposit} ${catalog.policy.cancellation}`;
  const consentBox = $('[data-consent]');
  consentBox.addEventListener('change', () => {
    state.consent = consentBox.checked;
    if (state.consent) showError(null);
  });
  $$('[data-method]').forEach((b) => {
    fx.pressable(b, {pressScale: 0.96});
    b.addEventListener('click', () => {
      showError(null);
      state.method = b.dataset.method;
      $$('[data-method]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      updateBar();
    });
  });

  function renderTicket() {
    const q = currentQuote();
    if (!q) return;
    const end = toHHMM(toMin(state.time) + q.durationMin);
    const where = state.mode === 'domicile' ? `À domicile · ${esc(q.zoneName)}${state.address ? ` · ${esc(state.address)}` : ''}` : `Au salon · ${esc(catalog.salon.address)}`;
    const lines = q.lines
      .map((l) => `<li class="${l.kind === 'discount' ? 'is-discount' : ''}"><span>${esc(l.label)}</span><span class="amount">${formatFCFA(l.amount)}</span></li>`)
      .join('');
    const travel = q.travelPending ? `<li><span>Déplacement</span><span class="amount">à confirmer</span></li>` : '';
    $('[data-ticket]').innerHTML = `
      <p class="ticket__when">${esc(formatDateLong(state.date))} · ${state.time} – ${end}</p>
      <p class="ticket__where">${where}</p>
      <ul class="ticket__lines">${lines}${travel}</ul>
      <p class="ticket__total"><span>Total${q.travelPending ? ' (hors déplacement)' : ''}</span><b>${formatFCFA(q.total)}</b></p>
      <div class="ticket__deposit">
        <svg class="mini-ring" viewBox="0 0 64 64" aria-hidden="true"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fill" cx="32" cy="32" r="26" data-mini-ring/></svg>
        <p>Acompte à payer maintenant (30 %)<b data-ticket-deposit>${formatFCFA(q.deposit)}</b>Reste à payer le jour J : ${formatFCFA(q.balance)}</p>
      </div>`;
    const ring = $('[data-mini-ring]');
    const len = fx.pathLength(ring);
    ring.style.strokeDasharray = `${len}`;
    ring.style.transform = 'rotate(-90deg)';
    if (fx.reduced) {
      ring.style.strokeDashoffset = `${len * 0.7}`;
      return;
    }
    // stat-bars-and-fills (anneau) + counting-dynamic-scale : même durée, même ease
    const tl = gsap.timeline({delay: 0.25});
    tl.fromTo(ring, {strokeDashoffset: len}, {strokeDashoffset: len * 0.7, duration: 1.1, ease: 'power3.out'}, 0);
    fx.countTo(tl, $('[data-ticket-deposit]'), q.deposit, 0, {duration: 1.1, format: formatFCFA, startScale: 0.85});
    gsap.fromTo($$('.ticket__lines li'), {opacity: 0, x: -14}, {opacity: 1, x: 0, duration: 0.45, ease: 'power3.out', stagger: 0.06});
  }

  // ——— Barre du bas ———
  function updateBar() {
    const q = currentQuote();
    const total = q?.total ?? 0;
    if (!fx.reduced && total !== shownTotal) {
      const s = {v: shownTotal};
      gsap.to(s, {v: total, duration: 0.6, ease: 'power3.out', onUpdate: () => (ui.total.textContent = formatFCFA(s.v)), overwrite: true});
    } else ui.total.textContent = formatFCFA(total);
    shownTotal = total;
    ui.dur.textContent = q ? `≈ ${formatDuration(q.durationMin)}` : '';
    ui.deposit.textContent = formatFCFA(q?.deposit ?? 0);
    ui.back.hidden = state.step === 1 || state.step === 'status';
    if (state.step === 5) ui.next.textContent = q ? `Payer ${formatFCFA(q.deposit)}` : 'Payer';
    else ui.next.textContent = 'Continuer';
  }

  const fieldError = (sel, msg) => {
    const f = $(sel)?.closest('.field');
    f?.classList.add('is-invalid');
    $(sel)?.focus();
    return msg;
  };

  function validate(step) {
    if (step === 1) {
      if (!state.services.size) return 'Choisissez au moins une prestation.';
      for (const sel of state.services.values()) {
        const s = catalog.services.find((x) => x.id === sel.id);
        if (s.options && !sel.option) return `${s.name} : précisez ${s.options.join(' ou ').toLowerCase()}.`;
      }
    }
    if (step === 2) {
      if (!state.mode) return 'Choisissez le salon ou le domicile.';
      if (state.mode === 'domicile' && state.address.trim().length < 4) return fieldError('[data-address]', 'Indiquez votre adresse.');
    }
    if (step === 3) {
      if (!state.date) return 'Choisissez une date.';
      if (!state.time) return 'Choisissez un horaire.';
    }
    if (step === 4) {
      if (state.name.trim().length < 2) return fieldError('[data-name]', 'Indiquez votre nom.');
      if (!normalizePhoneCI(state.phone)) return fieldError('[data-phone]', 'Numéro ivoirien à 10 chiffres (ex. 07 17 22 17 54).');
      if (state.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(state.email)) return fieldError('[data-email]', 'Adresse e-mail invalide.');
    }
    if (step === 5) {
      if (!state.method) return 'Choisissez Wave ou Orange Money.';
      if (!state.consent) return 'Cochez la case pour accepter l’acompte.';
    }
    return null;
  }

  const showError = (msg) => {
    ui.error.textContent = msg ?? '';
    if (msg && !fx.reduced) gsap.fromTo(ui.error, {opacity: 0, y: 6}, {opacity: 1, y: 0, duration: 0.3, ease: 'power2.out'});
  };

  // ——— Navigation entre étapes ———
  function stepEl(step) {
    return $(`[data-step="${step}"]`);
  }

  function goTo(step, {dir = 1, instant = false, onEnter} = {}) {
    const from = stepEl(state.step);
    const to = stepEl(step);
    state.step = step;
    showError(null);
    ui.title.textContent = STEP_TITLES[step];
    const n = step === 'status' ? 5 : step;
    ui.stepLabels.forEach((li, i) => {
      li.classList.toggle('is-current', i + 1 === n && step !== 'status');
      li.classList.toggle('is-done', i + 1 < n || step === 'status');
    });
    ui.bar.hidden = step === 'status';
    updateBar();
    ui.body.scrollTop = 0;

    const enter = () => {
      $$('[data-step]').forEach((s) => (s.hidden = s !== to));
      // le contenu se construit une fois l'étape affichée : les tracés SVG se mesurent sur un élément rendu
      if (step === 3) renderCalendar(!instant);
      if (step === 3 && state.date) loadSlots();
      if (step === 5) renderTicket();
      onEnter?.();
      if (fx.reduced || instant) return;
      const tl = gsap.timeline();
      tl.fromTo(to, {opacity: 0, x: 26 * dir}, {opacity: 1, x: 0, duration: 0.45, ease: 'power3.out'}, 0);
      const items = to.querySelectorAll('.pick-row, .place__opt, .cal, .field, .ticket, .pay__opt, .check');
      if (items.length) tl.fromTo(items, {opacity: 0, y: 18}, {opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: fx.capStagger(items.length, 0.05, 0.4)}, 0.05);
      tl.fromTo(ui.title, {opacity: 0, y: 14}, {opacity: 1, y: 0, duration: 0.4, ease: 'power3.out'}, 0);
    };
    if (!fx.reduced && !instant) {
      gsap.to(ui.progress, {scaleX: n / 5, duration: 0.6, ease: 'power3.inOut'});
      if (from && from !== to && !from.hidden) {
        gsap.to(from, {opacity: 0, x: -20 * dir, duration: 0.2, ease: 'power2.in', onComplete: enter});
        return;
      }
    } else gsap.set(ui.progress, {scaleX: n / 5});
    enter();
  }

  ui.next.addEventListener('click', async () => {
    if (busy) return;
    const err = validate(state.step);
    if (err) return showError(err);
    if (state.step === 5) return submit();
    goTo(state.step + 1, {dir: 1});
  });
  ui.back.addEventListener('click', () => {
    if (!busy && typeof state.step === 'number' && state.step > 1) goTo(state.step - 1, {dir: -1});
  });
  fx.pressable(ui.next);

  // ——— Paiement ———
  async function submit() {
    busy = true;
    ui.next.disabled = true;
    ui.next.textContent = 'Connexion au paiement…';
    try {
      const res = await api.createBooking(catalog, {
        ...selection(),
        date: state.date,
        time: state.time,
        address: state.address,
        landmark: state.landmark,
        client: {name: state.name, phone: state.phone, email: state.email},
        notes: state.notes,
        method: state.method,
        consent: state.consent,
      });
      if (res.redirectUrl) {
        // on quitte vers Wave / Orange Money (ou la page de paiement simulé du serveur)
        if (!fx.reduced) await gsap.to(ui.panel, {opacity: 0, y: -20, duration: 0.35, ease: 'power2.in'});
        window.location.assign(res.redirectUrl);
        return;
      }
      goTo('status', {onEnter: () => renderStatus(res, res.manual ? 'manual' : 'demo')});
    } catch (e) {
      showError(e.message);
      if (e.status === 409) {
        state.time = null;
        goTo(3, {dir: -1});
        showError(e.message);
      }
    } finally {
      busy = false;
      ui.next.disabled = false;
      updateBar();
    }
  }

  // ——— Statut / confirmation ———
  const ICON = {
    wait: '<svg class="status__icon" viewBox="0 0 120 120" aria-hidden="true"><circle class="c-bg" cx="60" cy="60" r="50"/><circle class="c-fg" cx="60" cy="60" r="50" data-spin/></svg>',
    ok: '<svg class="status__icon" viewBox="0 0 120 120" aria-hidden="true"><circle class="c-bg" cx="60" cy="60" r="50"/><circle class="c-fg" cx="60" cy="60" r="50" data-draw/><path class="mark" d="M38 62 54 77 84 45" data-draw/></svg>',
    ko: '<svg class="status__icon" viewBox="0 0 120 120" aria-hidden="true"><circle class="c-bg" cx="60" cy="60" r="50"/><path class="mark" d="M44 44 76 76M76 44 44 76" data-draw/></svg>',
  };

  function details(b) {
    return `<p>${esc(b.services.join(' + '))}<br>${esc(formatDateLong(b.date))} à ${esc(b.time)} · ${b.mode === 'domicile' ? 'à domicile' : 'au salon, Angré Djibi 1'}</p>`;
  }

  // texte iCalendar (RFC 5545) : virgules, points-virgules et barres obliques inverses échappés
  const icsText = (s) => String(s).replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');

  function ics(b) {
    const d = b.date.replace(/-/g, '');
    const start = `${d}T${b.time.replace(':', '')}00Z`;
    const endMin = toMin(b.time) + b.quote.durationMin;
    const end = `${d}T${toHHMM(Math.min(endMin, 23 * 60 + 59)).replace(':', '')}00Z`;
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Cut & Care Styling//Reservation//FR',
      'BEGIN:VEVENT',
      `UID:${b.id}@cutcarestyling`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsText(`Cut & Care Styling — ${b.services.join(' + ')}`)}`,
      `LOCATION:${icsText(b.mode === 'domicile' ? 'À domicile' : `${catalog.salon.address} (Yango : ${catalog.salon.yango})`)}`,
      `DESCRIPTION:${icsText(`Réf. ${b.ref} — acompte ${formatFCFA(b.quote.deposit)} payé, reste ${formatFCFA(b.quote.balance)} le jour J.`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    return URL.createObjectURL(new Blob([body], {type: 'text/calendar'}));
  }

  function renderStatus(b, kind) {
    const method = METHOD[b.method] ?? '';
    let html = '';
    if (kind === 'wait') {
      html = `${ICON.wait}<h3>Vérification du paiement…</h3><p>Nous confirmons votre acompte auprès de ${esc(method || 'votre opérateur')}.</p>`;
    } else if (kind === 'paid') {
      const msg = `Bonjour Cut & Care Styling ! J’ai réservé ${b.services.join(' + ')} le ${formatDateLong(b.date)} à ${b.time} (${b.mode === 'domicile' ? 'à domicile' : 'au salon'}). Réf. ${b.ref}, acompte de ${formatFCFA(b.quote.deposit)} payé par ${method}.`;
      html = `${ICON.ok}<h3><span class="script">Merci ${esc(b.firstName)} !</span>C’est réservé</h3>${details(b)}
        <p class="ref">${esc(b.ref)}</p>
        <p>Acompte payé : <b>${formatFCFA(b.quote.deposit)}</b> · reste le jour J : <b>${formatFCFA(b.quote.balance)}</b>${b.quote.travelPending ? ' (+ déplacement à confirmer)' : ''}</p>
        <div class="actions"><a class="btn btn--sm" href="${ics(b)}" download="cut-and-care-${esc(b.ref)}.ics">Ajouter à mon agenda</a>
        <a class="btn btn--ghost btn--sm" href="${wa(msg)}" target="_blank" rel="noopener">Prévenir le salon sur WhatsApp</a></div>`;
    } else if (kind === 'failed') {
      html = `${ICON.ko}<h3>Le paiement n’a pas abouti</h3><p>Aucun acompte n’a été encaissé et le créneau a été libéré. Vous pouvez recommencer ou nous écrire.</p>
        <div class="actions"><button type="button" class="btn btn--sm" data-restart>Recommencer</button>
        <a class="btn btn--ghost btn--sm" href="${wa(`Bonjour ! Mon paiement d’acompte n’a pas abouti (réf. ${b.ref}). Pouvez-vous m’aider ?`)}" target="_blank" rel="noopener">Aide sur WhatsApp</a></div>`;
    } else if (kind === 'pending') {
      html = `${ICON.wait}<h3>Paiement en cours de validation</h3><p>${esc(method)} n’a pas encore confirmé l’acompte. Gardez cette page ouverte ou actualisez dans un instant.</p>
        <p class="ref">${esc(b.ref)}</p><div class="actions"><button type="button" class="btn btn--sm" data-refresh>Actualiser</button></div>`;
    } else if (kind === 'manual') {
      const msg = `Bonjour ! Je viens d’envoyer l’acompte de ${formatFCFA(b.quote.deposit)} par ${method} pour la réservation ${b.ref} (${b.services.join(' + ')}, ${formatDateLong(b.date)} à ${b.time}). Voici la capture :`;
      html = `${ICON.wait}<h3>Dernière étape : l’acompte</h3>${details(b)}<p class="ref">${esc(b.ref)}</p>
        <div class="manual"><p>Envoyez <b>${formatFCFA(b.quote.deposit)}</b> par <b>${esc(method)}</b> au <b>${esc(b.manual?.number ?? '')}</b>, puis envoyez la capture au salon. Votre créneau est confirmé dès réception.</p></div>
        <div class="actions"><a class="btn btn--sm" href="${wa(msg)}" target="_blank" rel="noopener">J’ai payé : envoyer la preuve</a></div>`;
    } else if (kind === 'demo') {
      html = `${ICON.wait}<h3>Paiement simulé</h3>${details(b)}<p class="ref">${esc(b.ref)}</p>
        <p>Mode démo : aucune somme n’est débitée. En production, ce bouton ouvre ${esc(method)} pour régler <b>${formatFCFA(b.quote.deposit)}</b>.</p>
        <div class="actions"><button type="button" class="btn btn--sm" data-demo="paid">Simuler un paiement réussi</button>
        <button type="button" class="btn btn--ghost btn--sm" data-demo="failed">Simuler un échec</button></div>`;
    }
    ui.status.innerHTML = html;
    animateStatus(kind);
    ui.status.querySelector('[data-restart]')?.addEventListener('click', restart);
    ui.status.querySelector('[data-refresh]')?.addEventListener('click', () => poll(b.id));
    ui.status.querySelectorAll('[data-demo]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const done = api.settleLocal(b.id, btn.dataset.demo === 'paid' ? 'paid' : 'payment_failed');
        renderStatus(done ?? {...b, status: btn.dataset.demo}, btn.dataset.demo === 'paid' ? 'paid' : 'failed');
      }),
    );
  }

  function animateStatus(kind) {
    const spin = ui.status.querySelector('[data-spin]');
    if (spin) {
      const len = fx.pathLength(spin);
      spin.style.strokeDasharray = `${len * 0.28} ${len}`;
      if (!fx.reduced) gsap.fromTo(spin, {rotation: 0, svgOrigin: '60 60'}, {rotation: 360, svgOrigin: '60 60', duration: 1.1, ease: 'none', repeat: -1});
    }
    if (fx.reduced) return;
    const tl = gsap.timeline();
    const draws = ui.status.querySelectorAll('[data-draw]');
    if (draws.length) fx.drawIn(tl, draws, 0, {duration: 0.6});
    const items = [...ui.status.children].filter((c) => !c.matches('svg'));
    tl.fromTo(items, {opacity: 0, y: 22}, {opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: fx.capStagger(items.length, 0.08)}, 0.15);
    if (kind === 'paid') tl.add(playBurst(), 0.45);
  }

  async function poll(id) {
    renderStatus({method: null}, 'wait');
    for (let i = 0; i < 12; i++) {
      let b;
      try {
        b = await api.getBooking(id, {refresh: true});
      } catch (e) {
        ui.status.innerHTML = `${ICON.ko}<h3>Réservation introuvable</h3><p>${esc(e.message)}</p>`;
        animateStatus('failed');
        return;
      }
      if (b.status === 'paid') return renderStatus(b, 'paid');
      if (b.status === 'payment_failed' || b.status === 'expired' || b.status === 'cancelled') return renderStatus(b, 'failed');
      if (i === 0) renderStatus(b, 'wait');
      await new Promise((r) => setTimeout(r, 2500));
      if (i === 11) return renderStatus(b, 'pending');
    }
  }

  function restart() {
    state = fresh();
    syncPicks();
    syncPlace();
    $$('[data-method]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    consentBox.checked = false;
    for (const sel of ['[data-name]', '[data-phone]', '[data-email]', '[data-notes]', '[data-address]', '[data-landmark]']) $(sel).value = '';
    history.replaceState(null, '', location.pathname + location.hash);
    goTo(1, {dir: -1});
  }

  // ——— Ouverture / fermeture ———
  function trapFocus(e) {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea')].filter((x) => x.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function open({service, mode, origin} = {}) {
    if (service && catalog.services.some((s) => s.id === service) && !state.services.has(service)) {
      state.services.set(service, {id: service});
      state.date = null;
      state.time = null;
    }
    if (mode) state.mode = mode;
    syncPicks();
    syncPlace();
    updateBar();
    lastFocus = document.activeElement;
    root.hidden = false;
    isOpen = true;
    lenis?.stop();
    document.documentElement.style.overflow = 'hidden';
    root.addEventListener('keydown', trapFocus);
    const start = typeof state.step === 'number' ? state.step : 1;
    goTo(start, {instant: true});
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    if (fx.reduced) gsap.set(ui.iris, {clipPath: 'none'});
    else {
      // ouverture en iris depuis le bouton cliqué (techniques.md §12, clip-path reveal)
      const tl = gsap.timeline();
      tl.fromTo(ui.iris, {clipPath: `circle(0px at ${x}px ${y}px)`}, {clipPath: `circle(${r}px at ${x}px ${y}px)`, duration: 0.85, ease: 'expo.inOut'});
      tl.fromTo([...root.querySelectorAll('.booking__head > *'), stepEl(state.step), ui.bar], {opacity: 0, y: 28}, {opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.04}, 0.38);
    }
    setTimeout(() => root.querySelector('.booking__close').focus(), fx.reduced ? 0 : 500);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    root.removeEventListener('keydown', trapFocus);
    const done = () => {
      root.hidden = true;
      document.documentElement.style.overflow = '';
      lenis?.start();
      lastFocus?.focus?.();
      if (state.step === 'status') restart();
      root.dispatchEvent(new CustomEvent('booking:closed'));
    };
    if (fx.reduced) return done();
    const btn = root.querySelector('.booking__close').getBoundingClientRect();
    const x = btn.left + btn.width / 2;
    const y = btn.top + btn.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const tl = gsap.timeline({onComplete: done});
    tl.to(ui.panel, {opacity: 0, duration: 0.25, ease: 'power2.in'}, 0);
    tl.fromTo(ui.iris, {clipPath: `circle(${r}px at ${x}px ${y}px)`}, {clipPath: `circle(0px at ${x}px ${y}px)`, duration: 0.6, ease: 'expo.inOut'}, 0.1);
    tl.set(ui.panel, {opacity: 1});
  }

  root.querySelector('[data-close]').addEventListener('click', close);

  /** Retour de Wave / Orange Money : on interroge le serveur, jamais l'URL. */
  function openStatus(id) {
    open({});
    goTo('status', {instant: true});
    poll(id);
  }

  return {
    open,
    close,
    openStatus,
    setDemo(on) {
      ui.demoBadge.hidden = !on;
    },
  };
}
