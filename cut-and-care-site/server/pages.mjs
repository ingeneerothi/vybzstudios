// Petites pages rendues par le serveur : paiement simulé (mode démo) et tableau de bord du salon.
import {formatFCFA} from '../public/js/pricing.mjs';
import {formatDateLong} from '../public/js/slots.mjs';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

const shell = (title, body) => `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${esc(title)}</title><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/server-pages.css"></head>
<body>${body}</body></html>`;

export function renderDemoPay(b) {
  const method = b.method === 'wave' ? 'Wave' : 'Orange Money';
  return shell('Paiement simulé — mode démo', `<main class="sp-card">
  <p class="sp-badge">Mode démonstration</p>
  <h1>Paiement simulé</h1>
  <p class="sp-lead">Aucune somme n’est débitée. Ajoutez vos clés ${esc(method)} dans le fichier <code>.env</code> pour encaisser de vrais acomptes.</p>
  <dl class="sp-dl"><dt>Réservation</dt><dd>${esc(b.ref)}</dd><dt>Moyen</dt><dd>${esc(method)}</dd>
  <dt>Acompte (30 %)</dt><dd><strong>${formatFCFA(b.quote.deposit)}</strong></dd></dl>
  <form method="post" action="/demo-pay" class="sp-actions">
    <input type="hidden" name="id" value="${esc(b.id)}">
    <button name="outcome" value="paid" class="sp-btn">Simuler un paiement réussi</button>
    <button name="outcome" value="failed" class="sp-btn sp-btn--ghost">Simuler un échec</button>
  </form></main>`);
}

const STATUS = {
  pending_payment: 'En attente de paiement',
  paid: 'Acompte payé',
  payment_failed: 'Paiement échoué',
  expired: 'Expirée',
  cancelled: 'Annulée',
  done: 'Terminée',
};

export function renderAdmin(bookings, token, {demo = false} = {}) {
  const rows = [...bookings]
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .map((b) => `<tr class="st-${esc(b.status)}">
  <td><strong>${esc(b.ref)}</strong><br><small>${esc(STATUS[b.status] ?? b.status)}${b.payment?.mode === 'demo' ? ' (simulé)' : b.payment?.mode === 'manual' && b.status !== 'paid' ? ' · à vérifier' : ''}</small></td>
  <td>${esc(formatDateLong(b.date))}<br><small>${esc(b.time)} · ${esc(b.mode === 'domicile' ? 'À domicile' : 'Au salon')}</small></td>
  <td>${esc(b.quote.lines.filter((l) => l.kind === 'service').map((l) => l.label).join(', '))}${b.student ? '<br><small>Tarif étudiant (carte à vérifier)</small>' : ''}</td>
  <td>${esc(b.client.name)}<br><a href="https://wa.me/${esc(b.client.phone.replace('+', ''))}">${esc(b.client.phone)}</a></td>
  <td>${b.mode === 'domicile' ? `${esc(b.quote.zoneName)}<br><small>${esc(b.address)}${b.landmark ? ` — ${esc(b.landmark)}` : ''}</small>` : '—'}</td>
  <td>${formatFCFA(b.quote.total)}<br><small>acompte ${formatFCFA(b.quote.deposit)} · ${esc(b.method === 'wave' ? 'Wave' : 'Orange Money')}</small></td>
  <td><form method="post" action="/admin/bookings/${esc(b.id)}?token=${encodeURIComponent(token)}">
    ${b.status !== 'paid' ? '<button name="status" value="paid">Acompte reçu</button>' : ''}
    ${b.status !== 'cancelled' ? '<button name="status" value="cancelled" class="ghost">Annuler</button>' : ''}
  </form></td></tr>`)
    .join('');
  return shell('Réservations — Cut & Care Styling', `<main class="sp-admin"><h1>Réservations</h1>
  ${demo ? '<p class="sp-warn">Mode démo actif : les paiements sont simulés, aucun acompte n’est réellement encaissé. Ajoutez les clés Wave / Orange Money dans .env.</p>' : ''}
  <table><thead><tr><th>Réf.</th><th>Rendez-vous</th><th>Prestations</th><th>Client</th><th>Domicile</th><th>Montants</th><th></th></tr></thead>
  <tbody>${rows || '<tr><td colspan="7">Aucune réservation pour le moment.</td></tr>'}</tbody></table></main>`);
}
