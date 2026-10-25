# Vertical Store

Boutique de sneakers en ligne (Côte d'Ivoire) : catalogue animé, commande en une page, envoi de la commande sur WhatsApp, espace vendeur installable sur téléphone.

- **Site public** : accueil, collection filtrable, fiche produit avec galerie 3D, commande, demande d'article introuvable.
- **Admin** (`/admin`) : chaussures (photos, prix, promos, ruptures), commandes et demandes, numéros WhatsApp, zones de livraison.
- **Technique** : Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion · Supabase · Vercel.

## Documentation

| Pour qui | Fichier |
| --- | --- |
| Mise en ligne, case par case (Supabase + Vercel, environ 20 min) | [MISE-EN-LIGNE.md](MISE-EN-LIGNE.md) |
| Le vendeur (utilisation de l'admin) | [GUIDE-VENDEUR.md](GUIDE-VENDEUR.md) |
| Le développeur (installation, Supabase, Vercel, organisation du code) | [NOTES-TECHNIQUES.md](NOTES-TECHNIQUES.md) |

## Démarrage rapide

```bash
npm install
npm run dev          # http://localhost:3000 — mode démo tant que Supabase n'est pas configuré
npm test             # tests unitaires + tests de la base (PGlite)
npm run build && npm run e2e   # parcours complet dans Chromium (mobile + PC)
npm run apercu       # aperçu hors ligne : apercu/sortie/vertical-store-apercu.html
```

## Aperçu hors ligne

`npm run apercu` construit **un seul fichier HTML** (≈ 3 Mo) avec le vrai site et le vrai espace vendeur,
en mode démo : il s'ouvre dans n'importe quel navigateur, sans internet, et ne publie rien.
Idéal pour montrer la boutique au vendeur avant la mise en ligne. Les commandes passées dans l'aperçu
s'affichent dans l'espace vendeur (lien en bas des pages), et tout repart à zéro à chaque ouverture.
Le même script filme une visite guidée d'une minute (`apercu/sortie/vertical-store-visite.mp4`), à envoyer sur WhatsApp,
et produit deux PDF : une présentation des écrans clés et une version mobile (`apercu/sortie/vertical-store-mobile.pdf`),
où chaque écran apparaît en entier, au format téléphone.
