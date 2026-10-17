// Sections construites depuis le catalogue — partagé navigateur / serveur / aperçu autonome.
// Le serveur et l'aperçu les écrivent directement dans le HTML : la page est complète même sans
// JavaScript (aperçu de fichiers sur iPhone, moteurs de recherche). Le navigateur ne les reconstruit
// que si elles sont vides.
import {formatDuration, formatFCFA} from './pricing.mjs';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

/** Lien WhatsApp du salon, message prérempli (réservation de secours sans JavaScript). */
export const waLink = (catalog, text) => `https://wa.me/${catalog.salon.whatsapp}?text=${encodeURIComponent(text)}`;

const PERK_ICONS = {
  shampoing: '<path d="M24 6c6 9 11 15 11 22a11 11 0 0 1-22 0c0-7 5-13 11-22Z"/><path d="M19 30a5 5 0 0 0 5 5"/>',
  collation: '<path d="M10 20h24v8a12 12 0 0 1-24 0Z"/><path d="M34 22h3a5 5 0 0 1 0 10h-4"/><path d="M17 8c-2 3 2 5 0 8M24 8c-2 3 2 5 0 8"/><path d="M8 42h30"/>',
  etudiant: '<path d="M4 18 24 9l20 9-20 9Z"/><path d="M12 22v10c0 3 6 6 12 6s12-3 12-6V22"/><path d="M44 18v12"/>',
  domicile: '<path d="M6 22 24 7l18 15"/><path d="M11 19v22h26V19"/><path d="M20 41V30h8v11"/>',
};

export function renderPerks(catalog) {
  return catalog.perks
    .map((p) => `<li class="perk"><svg viewBox="0 0 48 48" aria-hidden="true">${PERK_ICONS[p.id] ?? ''}</svg><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`)
    .join('');
}

/**
 * Cartes de prix. `asset` résout le chemin d'une photo ; `srcset: false` évite de répéter
 * une même image intégrée en data URI (aperçu autonome).
 */
export function renderServices(catalog, {asset = (p) => p, srcset = true} = {}) {
  return catalog.services
    .map((s) => {
      const small = esc(asset(`img/${s.img}-640.webp`));
      const set = srcset ? ` srcset="${small} 640w, ${esc(asset(`img/${s.img}-1280.webp`))} 1280w" sizes="(min-width: 1100px) 26vw, (min-width: 760px) 40vw, 80vw"` : '';
      const book = waLink(catalog, `Bonjour Cut & Care Styling ! Je souhaite réserver : ${s.name}.`);
      return `<article class="svc" data-svc="${esc(s.id)}">
  <div class="svc__arch arch"><img src="${small}"${set} alt="${esc(s.name)} — réalisation Cut &amp; Care Styling" loading="lazy" width="640" height="1138" style="object-position:${esc(s.focus ?? '50% 50%')}"></div>
  ${catalog.studentDiscount.eligible.includes(s.id) ? `<span class="svc__badge">${esc(catalog.studentDiscount.label)}<small>ÉTUDIANT·E·S</small></span>` : ''}
  <div class="svc__band">
    <h3 class="svc__name">${esc(s.name)}</h3>
    <p class="svc__price"><span data-price="${s.price}">${formatFCFA(s.price, {suffix: ''})}</span><small>F CFA</small></p>
    <p class="svc__note">${s.note ? `${esc(s.note)} · ` : ''}≈ ${formatDuration(s.durationMin)}</p>
    <a class="btn btn--light btn--sm" href="${esc(book)}" data-book data-book-service="${esc(s.id)}">Réserver</a>
  </div>
</article>`;
    })
    .join('');
}

export const durationsNote = (catalog) =>
  `Tarifs de l’offre semaine (mardi → vendredi). Durées indicatives${catalog.durationsConfirmed ? '' : ', confirmées par le salon'}. ${catalog.studentDiscount.condition}`;

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function hoursHtml(catalog) {
  const {hours, bookableWeekdays: wd} = catalog.booking;
  const first = DAYS[wd[0]];
  const range = hours[wd[0]].join(' – ').replace(/:/g, ' h ').replace(/ h 00/g, ' h');
  return `${first[0].toUpperCase()}${first.slice(1)} → ${DAYS[wd[wd.length - 1]]} : ${esc(range)}<br>Week-end : réservation sur WhatsApp`;
}

/** Remplit les emplacements <!--perks--> <!--services--> <!--durations--> <!--hours--> <!--year--> de index.html. */
export function fillPage(html, catalog, options) {
  return html
    .replace('<!--perks-->', () => renderPerks(catalog))
    .replace('<!--services-->', () => renderServices(catalog, options))
    .replace('<!--durations-->', () => esc(durationsNote(catalog)))
    .replace('<!--hours-->', () => hoursHtml(catalog))
    .replace('<!--year-->', () => String(new Date().getFullYear()));
}
