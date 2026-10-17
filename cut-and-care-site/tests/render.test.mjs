import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fillPage, renderServices, waLink} from '../public/js/render.mjs';

const catalog = JSON.parse(readFileSync(new URL('../public/data/catalog.json', import.meta.url), 'utf8'));
const index = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

test('la page est complète sans JavaScript : tous les emplacements sont remplis', () => {
  const html = fillPage(index, catalog);
  assert.doesNotMatch(html, /<!--(perks|services|durations|hours|year)-->/);
  assert.equal(html.match(/class="svc"/g).length, catalog.services.length);
  assert.equal(html.match(/class="perk"/g).length, catalog.perks.length);
  assert.match(html, /15 000/);
});

test('chaque bouton « Réserver » a un lien WhatsApp de secours', () => {
  const html = fillPage(index, catalog);
  for (const a of html.match(/<a [^>]*data-book[^>]*>/g)) assert.match(a, /href="https:\/\/wa\.me\/2250717221754\?text=/);
  assert.equal(waLink(catalog, 'a & b'), 'https://wa.me/2250717221754?text=a%20%26%20b');
});

test('aperçu autonome : chemins d’images résolus, sans srcset', () => {
  const html = renderServices(catalog, {asset: (p) => `X:${p}`, srcset: false});
  assert.doesNotMatch(html, /srcset/);
  assert.match(html, /src="X:img\/tresses-1-640\.webp"|src="X:img\/[a-z0-9-]+-640\.webp"/);
});
