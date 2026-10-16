# Cut & Care Styling — « Offre semaine · Coiffez-vous au calme »

Pub motion design verticale 1080×1920, 30 i/s, 45 s, construite avec [Remotion](https://www.remotion.dev).
Voix off ElevenLabs (version A du script), photos du salon améliorées par IA.

Vidéo finale : `out/cut-and-care-offre-semaine.mp4` (H.264, AAC 320 kb/s).

## Re-rendre

```bash
npm install
npx remotion studio                 # prévisualisation
npm run render                      # -> out/cut-and-care-offre-semaine.mp4
node tools/stills.mjs 30 300 1349   # images de contrôle -> out/stills/
```

`remotion.config.ts` pointe vers le Chromium headless de l'environnement cloud.
En local : `REMOTION_BROWSER=auto npm run render` (Remotion télécharge son navigateur).

Les textes de contact (WhatsApp, @, adresse, Yango) sont des props zod modifiables dans le Studio.

## Chaîne de préparation

| Étape | Outil | Détail |
|---|---|---|
| Voix off | `tools/prepare_voiceover.py <mp3>` | MP3 d'origine 47,9 s → pauses longues raccourcies, time-stretch rubberband ×1,057 (hauteur conservée), loudnorm −15 LUFS / −1,5 dBTP → `public/voix-off.wav` (43,9 s) + repères `src/voiceover-segments.json` |
| Photos | UpscalerJS ESRGAN-thick ×2 (tfjs-node) puis `tools/grade_photos.py` | Recadrage, balance des blancs chaude homogène, courbe douce, clarté locale, vibrance, netteté → `public/images/*.jpg` |
| Synchro | `src/timeline.ts` | Chaque mot clé (prix, chiffres du WhatsApp, slogan) calé au 1/30 s sur la voix |

## Structure

- `src/scenes/Intro.tsx` — accroche « Mesdames… », offre mardi → vendredi
- `src/scenes/Prix.tsx` — tissage, nattes, tresses, micro twist, micro twist locks, coupe, maintenance
- `src/scenes/Avantages.tsx` — shampooing + collation, −33 % carte étudiant/scolaire, service à domicile
- `src/scenes/Contacts.tsx` — TikTok/Instagram, Angré Djibi 1 + Yango, WhatsApp
- `src/scenes/Final.tsx` — zoom sur le cadre du salon, carte finale (logo en croix, slogan, contacts)

Licence Remotion : gratuite pour les indépendants et les entreprises de 3 personnes max, licence entreprise au-delà.
