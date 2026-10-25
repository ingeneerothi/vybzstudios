# Notes techniques — Vertical Store

Tout ce qu'il faut pour installer, mettre en ligne et faire évoluer le site.

1. [Vue d'ensemble](#1-vue-densemble)
2. [Organisation du projet](#2-organisation-du-projet)
3. [Lancer le site sur son ordinateur](#3-lancer-le-site-sur-son-ordinateur)
4. [Configurer Supabase (pas à pas)](#4-configurer-supabase-pas-à-pas)
5. [Mettre en ligne avec GitHub + Vercel (pas à pas)](#5-mettre-en-ligne-avec-github--vercel-pas-à-pas)
6. [Ajouter un administrateur](#6-ajouter-un-administrateur)
7. [Refaire un déploiement](#7-refaire-un-déploiement)
8. [Ajouter des chaussures en lot (script Python)](#8-ajouter-des-chaussures-en-lot-script-python)
9. [Tests](#9-tests)
10. [Sécurité](#10-sécurité)
11. [Limites connues et dépannage](#11-limites-connues-et-dépannage)

---

## 1. Vue d'ensemble

| Élément | Choix |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Turbopack), React 19, TypeScript |
| Style | Tailwind CSS 4 (jetons dans `src/app/globals.css`), police Archivo (fichier local) |
| Animations | Motion (`motion/react`) + View Transitions (morphing catalogue → fiche) |
| Données | Supabase : Postgres + Row Level Security, Storage (photos), Auth (admins) |
| Hébergement | Vercel (déploiement automatique à chaque `git push`) |

**Mode démo** : tant que les variables Supabase sont vides, le site fonctionne avec les données de `data/catalogue.json` et l'admin enregistre dans le navigateur (localStorage). Pratique pour essayer et pour les tests automatiques ; un bandeau « Mode démo » s'affiche dans l'admin.

**Parcours d'une commande** : formulaire → fonction Postgres `creer_commande` (vérifie stock, pointure, téléphone, recalcule prix + livraison, attribue `CMD-0042`, lit le numéro WhatsApp actif) → coche animée → `wa.me/<numéro actif>?text=<message>`.

**Cache** : `getCatalogue()` (`src/lib/donnees/catalogue.ts`) lit tout le catalogue en une fois avec `"use cache"` (rafraîchi chaque minute). Chaque modification dans l'admin appelle l'action serveur `rafraichirSite()` qui invalide le cache immédiatement (`updateTag`).

## 2. Organisation du projet

```
data/catalogue.json            Catalogue de départ (21 chaussures) + zones, numéro, réglages
assets-source/                 Images originales (montages, logo, fond) et planches de contrôle
public/chaussures/<slug>/      Vues détourées 1200×1200 (01.webp, 02.webp…)
public/marque/                 Logo SVG, photo de fond nette (AVIF + WebP)
public/admin.webmanifest       Manifeste PWA de l'admin
scripts/
  images/decouper_chaussures.py  Découpe + détourage (rembg/BiRefNet) des montages
  images/preparer_marque.py      Logo vectorisé, icônes PWA, fonds
  generer-seed.mjs               data/catalogue.json -> supabase/seed.sql + installation.sql
  generer-partage.mjs            Image d'aperçu WhatsApp (partage.jpg) de chaque chaussure (npm run partage)
  captures.mjs                   Captures d'écran 375/390/412/768/1440 px
apercu/                        Aperçu hors ligne en un fichier HTML (npm run apercu)
supabase/
  schema.sql                   Tables, RLS, fonctions, buckets (à coller dans Supabase)
  seed.sql                     Données de départ (généré)
  installation.sql             schema.sql + seed.sql, en un seul copier-coller (généré)
src/
  proxy.ts                     Session admin + redirection vers /admin/connexion
  app/(site)/                  Site public : accueil, collection, chaussure/[slug], commander/[slug], demande
  app/admin/                   Admin : connexion, mot de passe, (app)/chaussures|commandes|numeros|reglages
  app/auth/confirmer/route.ts  Lien « mot de passe oublié » reçu par email
  components/site|chaussure|commande|admin|marque|pages
  lib/
    donnees/                   Lecture du catalogue (Supabase ou démo) + cache
    admin/                     API admin (Supabase / démo), détourage navigateur, descriptions
    commande.ts                Envoi commande / demande
    whatsapp.ts                Messages et liens wa.me
    prix.ts, telephone.ts, format.ts, motion.ts (langage de mouvement)
tests/
  unit/                        Vitest : prix, téléphone, messages, slugs…
  sql/                         Vitest + PGlite : schéma, RLS, fonctions (Postgres dans Node)
  e2e/                         Playwright : parcours complet, demande, admin
```

## 3. Lancer le site sur son ordinateur

Prérequis : Node.js 20.9 ou plus récent (22 conseillé).

```bash
npm install
cp .env.example .env.local     # laisser vide = mode démo
npm run dev                    # http://localhost:3000
```

Admin en mode démo : `http://localhost:3000/admin`, n'importe quel email/mot de passe.

## 4. Configurer Supabase (pas à pas)

### 4.1 Créer le projet

1. Créez un compte sur [supabase.com](https://supabase.com) (bouton **Start your project**, connexion avec GitHub possible).
2. **New project** :
   - *Name* : `vertical-store`
   - *Database Password* : générez-en un et **gardez-le** (gestionnaire de mots de passe).
   - *Region* : la plus proche de la Côte d'Ivoire proposée (ex. Europe de l'Ouest).
3. Attendez 1 à 2 minutes que le projet soit prêt.

### 4.2 Créer les tables, la sécurité et les buckets

1. Menu de gauche → **SQL Editor** → **New query**.
2. Ouvrez `supabase/installation.sql`, copiez **tout** le contenu, collez, puis **Run**. Résultat attendu : *Success. No rows returned* (si Supabase signale une « opération destructive », confirmez : ce sont des `drop policy if exists`, aucune donnée n'est supprimée).
   - Ce fichier est `schema.sql` suivi de `seed.sql` (régénéré par `npm run seed`).
   - `schema.sql` crée les tables, active la Row Level Security partout, donne explicitement les droits d'accès aux rôles `anon` et `authenticated`, crée les fonctions (`creer_commande`, `creer_demande`, `activer_numero`…) et les buckets de stockage `produits` et `demandes`. Les emails admins sont déjà dedans (`angebattey.616@gmail.com`, `kodjojeanothniel24@icloud.com`).
   - `seed.sql` importe les 21 chaussures, les 4 zones, le numéro `+225 05 06 52 38 16` et les réglages.
   - Vérification : **Table Editor** → table `chaussures` → 21 lignes.

Le script peut être relancé sans risque (rien n'est dupliqué ni effacé). On peut aussi lancer `schema.sql` puis `seed.sql` séparément.

> Les photos des 21 chaussures de départ sont servies depuis le site (`public/chaussures/`). Les photos ajoutées ensuite depuis l'admin vont dans le bucket `produits`.

### 4.3 Réglages de connexion (Authentication)

1. **Authentication** → **Sign In / Providers** (ou *Providers*) → **Email** : laissez activé.
2. Désactivez **Allow new users to sign up** (personne ne peut créer de compte).
3. **Authentication** → **URL Configuration** :
   - *Site URL* : l'adresse du site (ex. `https://vertical-store.vercel.app`, à mettre à jour après l'étape 5).
   - *Redirect URLs* : ajoutez `https://vertical-store.vercel.app/**` et `http://localhost:3000/**`.

### 4.4 Créer les deux comptes admin

**Authentication** → **Users** → **Add user** → **Create new user**, deux fois :

| Email | Mot de passe | Option |
| --- | --- | --- |
| `angebattey.616@gmail.com` | à choisir (à transmettre au vendeur) | cocher **Auto Confirm User** |
| `kodjojeanothniel24@icloud.com` | à choisir | cocher **Auto Confirm User** |

Seuls les emails listés dans la table `admins` ont accès à l'admin, même si un autre compte existait.

### 4.5 Lien « Mot de passe oublié » (recommandé)

Pour que le lien fonctionne même s'il est ouvert sur un autre téléphone que celui qui l'a demandé :
**Authentication** → **Emails** (*Email Templates*) → **Reset Password** → remplacez le lien du modèle par :

```html
<a href="{{ .SiteURL }}/auth/confirmer?token_hash={{ .TokenHash }}&type=recovery&suite=/admin/nouveau-mot-de-passe">Choisir un nouveau mot de passe</a>
```

Sans cette modification, le lien fonctionne aussi, mais seulement dans le navigateur qui a fait la demande.

> L'envoi d'emails intégré à Supabase est limité (quelques emails par heure). Pour un usage plus intense, branchez un service SMTP (Authentication → Emails → SMTP Settings).

### 4.6 Brancher le site à Supabase

1. **Project Settings** (roue dentée) → **API Keys** (ou **Data API**) :
   - *Project URL* → `NEXT_PUBLIC_SUPABASE_URL`
   - *Publishable key* (`sb_publishable_…`) — ou *anon public* sur les anciens projets → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ N'utilisez **jamais** la clé *secret* / *service_role* dans le site.
2. Dans `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Redémarrez `npm run dev`. Le bandeau « Mode démo » disparaît de l'admin ; connectez-vous avec un des deux comptes.

## 5. Mettre en ligne avec GitHub + Vercel (pas à pas)

### 5.1 GitHub

Le code est dans le dépôt `ingeneerothi/vybzstudios`. Vercel met en production la branche principale (`main`) :
chaque modification fusionnée dans `main` est mise en ligne automatiquement.

### 5.2 Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) avec **Continue with GitHub**.
2. **Add New…** → **Project** → choisissez `vybzstudios` → **Import** (autorisez l'accès au dépôt si Vercel le demande).
3. *Framework Preset* : **Next.js** (détecté). Ne changez pas les commandes.
4. Dépliez **Environment Variables** et ajoutez :

| Nom | Valeur |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé *publishable* / *anon* |
| `NEXT_PUBLIC_SITE_URL` | facultatif : l'adresse finale si vous avez un nom de domaine (sinon Vercel la fournit tout seul) |

5. **Deploy**. Au bout de 1 à 3 minutes, Vercel affiche l'adresse du site.
6. Retournez dans Supabase (étape 4.3) et mettez cette adresse dans *Site URL* et *Redirect URLs*.
7. Testez : une commande depuis le téléphone, puis la connexion à `/admin`.

**Nom de domaine** (optionnel) : Vercel → projet → **Settings** → **Domains** → ajoutez le domaine et suivez les instructions DNS. Mettez ensuite à jour `NEXT_PUBLIC_SITE_URL` (Vercel) et les URLs Supabase, puis redéployez.

> Les variables `NEXT_PUBLIC_…` sont intégrées au moment de la construction : après les avoir changées dans Vercel, faites **Redeploy** (section 7).

## 6. Ajouter un administrateur

1. Supabase → **SQL Editor** :

```sql
insert into public.admins (email) values ('nouvel.admin@exemple.com');
```

2. **Authentication** → **Users** → **Add user** → même email, mot de passe, **Auto Confirm User**.

Retirer un admin : `delete from public.admins where email = '...';` puis supprimez l'utilisateur dans **Users**.

## 7. Refaire un déploiement

- **Automatique** : chaque `git push` sur `main` redéploie le site.
- **Manuel** (ex. après un changement de variable) : Vercel → projet → **Deployments** → menu **⋯** du dernier déploiement → **Redeploy**.
- **Revenir en arrière** : même menu sur un ancien déploiement → **Promote to Production** (ou *Instant Rollback*).

Les données (chaussures, commandes…) sont dans Supabase : un redéploiement ne les touche pas.

## 8. Ajouter des chaussures en lot (script Python)

Pour un détourage de qualité studio (BiRefNet), plutôt que le détourage simple de l'admin :

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/images/requirements.txt
```

1. Déposez le montage dans `assets-source/montages/` et ajoutez la chaussure dans `data/catalogue.json` (`slug`, `source`, `nom`, `marque`, `couleur`, `prix`, `description` ; `pointures` si différent de 39–47 ; `exclureVues` pour écarter une vue coupée).
2. `python scripts/images/decouper_chaussures.py --slug mon-slug` (ou sans option pour tout refaire). Compter environ 40 s par vue sur un ordinateur portable.
3. Vérifiez la planche `assets-source/controle/<slug>.jpg` (vues numérotées : vert = gardée, rouge = écartée).
4. `npm run seed`, puis collez `supabase/seed.sql` dans le SQL Editor (seules les nouvelles chaussures sont ajoutées).
5. `git add` + `git commit` + `git push` pour publier les images.

Modèle plus rapide (moins précis sur les chaussures blanches) : `--modele isnet-general-use`.

## 8 ter. Photo de la chaussure dans la commande WhatsApp

Un lien `wa.me` ne transporte que du texte. Pour que la photo arrive comme une **vraie photo** (et pas comme un lien),
le site passe par le menu « Partager » du téléphone (Web Share API, `src/lib/partager.ts`) : la photo part dans
WhatsApp, le texte en légende. La photo est un JPEG 1200×900 fabriqué dans le navigateur à partir de la photo
principale (chaussure sur le fond du site, `src/lib/images/vitrine.ts`), préparé dès l'affichage de l'écran.

- **Client** (`Validation.tsx`) : sur un téléphone qui sait partager une photo, l'écran de validation propose deux
  étapes au lieu d'ouvrir WhatsApp tout seul : « 1. Ouvrir WhatsApp » (le message), puis « 2. Envoyer la photo »
  (même discussion, en haut de la liste). Ailleurs (ordinateur), comportement d'avant : WhatsApp s'ouvre seul.
- **Vendeur** (onglet Commandes) : « Envoyer au livreur, avec la photo » partage la photo avec toute la commande en
  légende ; on choisit le livreur dans WhatsApp. Sur ordinateur : la commande en texte (`wa.me/?text=`).

Envoyer la photo **sans aucune action** de personne (directement au livreur) demanderait l'API WhatsApp Business de
Meta (compte Meta Business, numéro dédié, modèles de messages validés, coût par conversation).

Les fiches gardent une image d'aperçu `partage.jpg` (JPEG 1200×630, `og:image`) pour les liens partagés :
`npm run partage` pour le catalogue de départ, fabriquée par l'admin pour les chaussures ajoutées.

**Phrase au début des commandes** : colonne `numeros_whatsapp.intro` (vide pour le numéro principal), réglée dans
l'onglet Numéros et proposée d'office (« Bonjour c'est Ange ») pour tout numéro ajouté après le premier.
`creer_commande` renvoie la phrase du numéro actif (`intro`), que `messageCommande` place en tête du message.

## 8 bis. Aperçu hors ligne (`npm run apercu`)

Produit `apercu/sortie/vertical-store-apercu.html` : le site et l'admin en un seul fichier, pour une démonstration sans serveur.

- `apercu/main.tsx` monte les **vrais composants** (`src/components/pages/*` pour le site, les pages client de `src/app/admin` pour l'admin) avec un petit routeur à base de `#` (`apercu/routeur.tsx`).
- `apercu/next/*` remplace `next/link`, `next/image` et `next/navigation` ; `apercu/vite.config.mts` remplace aussi l'écran de validation (le message WhatsApp s'affiche au lieu d'ouvrir WhatsApp) et force le mode démo.
- Les données vivent en mémoire (`apercu/stockage.ts`), avec deux commandes et une demande d'exemple (`apercu/exemples.ts`).
- Les styles viennent du build Next (Tailwind compilé) : le script relance `next build`, réduit les photos (720 px) puis assemble le tout avec Vite. `--vite` saute le build Next.
- Le script joue ensuite une visite guidée (`apercu/parcours.mjs`) dans Chromium en taille téléphone : il la filme (`apercu/sortie/vertical-store-visite.mp4`, H.264, environ 1 min, nécessite `ffmpeg`) et en tire les écrans clés. Ces écrans sont mis dans le fichier HTML et restent affichés tant que le site n'a pas démarré : les lecteurs qui bloquent JavaScript (aperçu WhatsApp, fichiers de l'iPhone…) montrent ces écrans à la suite au lieu d'une page blanche. `--sans-video` saute l'encodage de la vidéo.
- Deux PDF, qui s'ouvrent sur tous les téléphones : `vertical-store-presentation.pdf` (les écrans clés avec une légende, `apercu/presentation.mjs`) et `vertical-store-mobile.pdf` (`apercu/mobile.mjs` : chaque écran du site et de l'admin en entier, à 392 px de large, une page par écran).

Les pages publiques de `src/app/(site)` ne font que charger le catalogue puis afficher le composant correspondant de `src/components/pages/` : l'aperçu et le site affichent donc exactement la même chose.

## 9. Tests

```bash
npm test               # Vitest : logique (prix, téléphone, messages) + base de données (PGlite)
npm run build
npm run e2e            # Playwright : catalogue → produit → pointure → formulaire → lien WhatsApp (mobile + PC)
npx next start -p 3200 & npm run captures   # captures d'écran dans captures/
```

Les tests de la base exécutent `supabase/installation.sql` (deux fois) dans un vrai Postgres (PGlite) avec des rôles `anon`/`authenticated`, avec et sans les droits par défaut de Supabase : lecture publique, interdictions, calcul des prix et des promos, numéro actif unique, dépôts de photos.

Lighthouse (mobile) : `npx lighthouse https://votre-site --form-factor=mobile --view`.

## 10. Sécurité

- **Row Level Security sur toutes les tables.** Public : lecture du catalogue, des zones et des réglages. Il ne peut ni lire les commandes/demandes/numéros, ni écrire directement : il passe par `creer_commande` / `creer_demande` (`security definer`) qui valident tout et recalculent les montants (le navigateur n'envoie jamais de prix).
- **Admins** : `est_admin()` compare l'email du jeton à la table `admins`. Inscriptions publiques désactivées.
- **Numéro actif** : index unique partiel (un seul actif) + déclencheur différé (toujours un actif) + fonction `activer_numero` (bascule atomique).
- **Stockage** : bucket `produits` en écriture admins uniquement ; bucket `demandes` en dépôt public limité (nom de fichier aléatoire imposé, 5 Mo, images seulement), liste interdite.
- **Anti-abus** : 5 commandes (ou demandes) maximum par numéro de téléphone toutes les 10 minutes.
- La clé `service_role` n'est utilisée nulle part.

## 11. Limites connues et dépannage

- **Détourage dans l'admin** (gratuit, instantané, dans le navigateur) : efficace sur fond blanc uni ; une ombre grise peut rester sous la chaussure et une chaussure très blanche peut perdre un peu de contour. Alternatives : script Python (section 8, gratuit, qualité studio) ; services en ligne type remove.bg (payants au-delà de l'essai).
- **Description automatique** : modèles de phrases (gratuit, sans IA). Une IA payante (API Claude, par exemple) pourrait être branchée plus tard dans `src/lib/admin/description.ts`.
- **Supabase gratuit** : un projet sans aucune activité pendant 7 jours est mis en pause (réactivation en un clic dans le tableau de bord). Un site qui reçoit des visites reste actif.
- **Vercel gratuit (Hobby)** : prévu pour un usage non commercial ; pour une boutique, le plan Pro est recommandé par Vercel. L'optimisation d'images a un quota mensuel (largement suffisant ici).
- **« Le site affiche encore l'ancien prix »** : le cache se rafraîchit à chaque modification dans l'admin et toutes les minutes. Vérifiez que l'admin est bien connecté (pas de bandeau « Mode démo » en production).
- **« Accès refusé » dans l'admin** : l'email n'est pas dans la table `admins`, ou la session a expiré (se reconnecter).
- **Le lien de mot de passe oublié renvoie vers la connexion** : lien expiré ou déjà utilisé ; vérifiez aussi les *Redirect URLs* (4.3) et le modèle d'email (4.5).
