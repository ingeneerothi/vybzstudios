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
```
