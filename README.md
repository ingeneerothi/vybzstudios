# vybzstudios

Publicité motion design de Vybz Studios, faite avec [Remotion](https://www.remotion.dev).

- Composition `VybzAd` : 37 s, 1080x1920 (vertical), 60 images/s.
- Rendu final en 4K (2160x3840) avec `--scale=2`.
- Les vidéos finales à télécharger sont dans [`rendu/`](rendu/).

## Commandes

```bash
npm install
npm run dev                      # Remotion Studio : aperçu et réglages
npx remotion render VybzAd out/vybz-studios-pub-4k.mp4 --scale=2 --crf=17
```

Version galerie (H.265, format natif des téléphones), à partir du rendu 4K :

```bash
ffmpeg -i out/vybz-studios-pub-4k.mp4 -c:v libx265 -preset medium -crf 20 -pix_fmt yuv420p \
  -profile:v main -tag:v hvc1 \
  -x265-params "level-idc=5.1:vbv-maxrate=30000:vbv-bufsize=60000:colorprim=bt709:transfer=bt709:colormatrix=bt709:range=limited" \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 -color_range tv \
  -c:a copy -movflags +faststart rendu/vybz-studios-pub-4k-galerie.mp4
```

## Structure

| Fichier | Rôle |
| --- | --- |
| `src/timing.ts` | Minutage des 11 scènes (en images, 60 i/s) |
| `src/scenes/Problem.tsx` | Scènes 1 à 5 : accroche, pub ratée, réaction, pas de site, affiche ratée |
| `src/scenes/Solution.tsx` | Scènes 6 à 11 : Vybz Studios, soulagement, services, réalisations, appel à l'action |
| `src/components/` | Texte qui tremble / texte propre, logo vectoriel, téléphone, icônes, sons de touches |
| `src/VybzAd.tsx` | Assemblage des scènes et du son de la vidéo « casquette rouge » |

## Médias

- `public/media` est produit par `scripts/prepare-media.sh <dossier des fichiers d'origine>`. Le script recadre la vidéo du ciment, harmonise les volumes à environ -14 LUFS, crée les fonds flous et extrait le passage Cut & Care de 16 s à 21 s.
- `public/sfx` (sons de touches) est généré par `python3 scripts/make-clicks.py`.
- `scripts/stills.mjs` sert à rendre des images fixes pour vérifier le rendu.
