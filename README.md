# vybzstudios — OSCAN « Made in Djassa » · vidéo de présentation

Vidéo motion design verticale (TikTok / Reels) de la marque streetwear **Oscan** (Abidjan),
faite avec [Remotion](https://www.remotion.dev) (React + TypeScript).

- 1080 × 1920, 60 fps, 34,8 s (58 temps à 100 BPM), H.264
- Rendu final : `out/oscan-presentation.mp4` (+ `out/oscan-presentation-4k.mp4` en 2160 × 3840)

## Lancer

```bash
npm install
npm run preview          # Remotion Studio (alias de « npx remotion preview »)
npm run render           # -> out/oscan-presentation.mp4
npm run render:4k        # -> out/oscan-presentation-4k.mp4 (rendu ×2)
```

Pour vérifier les zones sûres dans le Studio : cocher `showSafeZones` dans le panneau des props.

Autres commandes :

```bash
node scripts/stills.mjs 0 540 900   # images de contrôle -> out/stills/ (SAFE=1 pour les zones sûres)

# régénérer les découpes depuis assets/source (déjà faites, à refaire seulement si les captures changent)
pip install numpy pillow scipy opencv-contrib-python-headless
npm run assets
```

Sans accès au téléchargement de Chrome (CI, conteneur), pointer Remotion vers un Chrome
headless installé : `export REMOTION_CHROME=/chemin/vers/chrome-headless-shell`.

## Modifier la vidéo

Tout se règle dans **`src/config.ts`** : textes, prix, tailles, ordre des produits, couleurs,
polices, tempo (`BPM`) et durée de chaque scène (en temps). Les coupes tombent toujours sur un
temps : changer `BPM` recale toute la vidéo.

| Scène | Temps | Contenu |
| --- | --- | --- |
| 1. Hook | 4 | les têtes claquent une à une sur le rideau, le logo s'écrase (screen shake) |
| 2. Présentation | 5 | sunburst jaune, « OSCAN — Made in Djassa » tapé à la machine |
| 3. L'univers | 6 | grille 3×3 des neuf têtes en cascade, wiggle en boucle |
| 4. Du dessin au produit | 7 | le trait se trace, la tête se remplit de couleurs puis glisse sur le t-shirt |
| 5. La collection | 8 × 3 | un produit par plan (nom, prix, tailles), slides / wipes secs |
| 6. Preuve sociale | 5 | compteurs 23,7 K abonnés / 667 K j'aime, « La communauté Oscan » |
| 7. Call to action | 7 | logo plein écran, « Commande sur WhatsApp », @_oscvn, flèche, MADE IN DJASSA |

## Code

```
src/
  config.ts              textes, prix, couleurs, timings
  OscanIntro.tsx         composition : TransitionSeries des scènes + grain + musique
  scenes/                une scène par fichier
  components/            TypewriterText, PopIn, ProductCard, Counter, Sunburst,
                         ShutterBackground, FilmGrain, Wordmark, Head, Transitions…
  lib/                   ressorts / easings / shake, timeline (temps), assets
scripts/
  extract_assets.py      découpe produits + têtes depuis assets/source (détourage,
                         super-résolution EDSR x4), textures, manifest
  trace_lineart.mjs      vectorise le trait de la tête rasta (effet draw-on)
```

## Assets

Tout vient de `assets/` (dossier « public » de Remotion) :

- `source/01.webp … 13.webp` — les 13 captures TikTok fournies (produits, prix, tailles).
- `products/`, `heads/`, `tee/`, `lineart/`, `textures/` — générés par `npm run assets`
  (`python3 -I scripts/extract_assets.py && node scripts/trace_lineart.mjs`).
  Les personnages sont uniquement découpés et agrandis, jamais redessinés.
- `fonts/` — Courier Prime Bold (machine à écrire), Anton (chiffres), Luckiest Guy (wordmark).

Optionnels (la vidéo fonctionne sans) :

- `assets/music.mp3` — musique de fond (fondu de sortie automatique). Réglages dans `MUSIC`.
- `assets/logo/oscan-logo.png` — logo officiel en PNG transparent ; remplace le wordmark
  typographique provisoire.
