# Mettre Vertical Store en ligne — environ 40 minutes

Le code est prêt sur GitHub (`ingeneerothi/vybzstudios`, branche `main`).
Il reste à créer **trois comptes** et à les relier :

- **Supabase** garde les chaussures, les commandes et les comptes du vendeur.
- **Vercel** met le site sur internet.
- **Meta (WhatsApp Business)** envoie chaque commande au vendeur **avec la photo de la chaussure** (étape 5).

Faites-le de préférence sur un ordinateur (il y a un long texte à copier-coller à l'étape 1.3).
Gardez cette page ouverte et cochez au fur et à mesure.

---

## Étape 1 — Supabase (10 min)

### 1.1 Créer le compte et le projet

- [ ] Allez sur **supabase.com** → **Start your project** → **Continue with GitHub**.
- [ ] **New project** :
  - *Name* : `vertical-store`
  - *Database Password* : cliquez **Generate a password**, puis **copiez-le dans un endroit sûr**.
  - *Region* : **West EU (Paris)** (la plus proche d'Abidjan).
- [ ] **Create new project**, puis attendez 1 à 2 minutes que le projet soit prêt.

### 1.2 Copier le script d'installation

- [ ] Ouvrez cette page : <https://github.com/ingeneerothi/vybzstudios/blob/main/supabase/installation.sql>
- [ ] Cliquez sur l'icône **Copy raw file** (deux carrés, en haut à droite du fichier).
  Sur téléphone : bouton **Raw**, puis « Tout sélectionner » et « Copier ».

### 1.3 Lancer le script

- [ ] Dans Supabase, menu de gauche → **SQL Editor** → **New query** (ou le bouton **+**).
- [ ] Collez **tout** le texte, puis cliquez **Run** (ou Ctrl + Entrée).
- [ ] Résultat attendu : **Success. No rows returned**.
  Si Supabase affiche un avertissement sur une « opération destructive », cliquez **Run this query** : le script ne supprime aucune donnée.
- [ ] Vérification : menu **Table Editor** → table `chaussures` → **21 lignes**.

Ce script crée les tables, la sécurité, les dossiers photos, et importe les 21 chaussures, les 4 zones de livraison et le numéro WhatsApp **+225 05 06 52 38 16**. On peut le relancer sans risque.

### 1.4 Créer les deux comptes admin

- [ ] **Authentication** → **Users** → **Add user** → **Create new user**
  - Email : `angebattey.616@gmail.com`
  - Password : choisissez-en un (à donner au vendeur)
  - Cochez **Auto Confirm User** → **Create user**
- [ ] Recommencez avec `kodjojeanothniel24@icloud.com`.

### 1.5 Fermer les inscriptions

- [ ] **Authentication** → **Sign In / Providers** (ou **Settings**) → désactivez **Allow new users to sign up** → **Save**.
  Personne d'autre ne pourra créer de compte. (Même sans ça, seuls ces deux emails ont accès à l'admin.)

### 1.6 Noter les deux clés du site

- [ ] Cliquez sur le bouton **Connect** en haut de la page du projet (ou **Project Settings** → **API Keys**), et gardez cet onglet ouvert :
  - **Project URL** : ressemble à `https://abcdefghijkl.supabase.co`
  - **Publishable key** : commence par `sb_publishable_…` (sur certains projets : **anon public**, commence par `eyJ…`)

⚠️ N'utilisez **jamais** la clé *secret* ou *service_role* : elle donne tous les droits.

---

## Étape 2 — Vercel (5 min)

- [ ] Allez sur **vercel.com** → **Sign Up** → offre **Hobby** → **Continue with GitHub**.
- [ ] **Add New…** → **Project** → à côté de `vybzstudios`, cliquez **Import**.
  Si le dépôt n'apparaît pas : **Configure GitHub App** (ou *Adjust GitHub App Permissions*) → autorisez `vybzstudios`.
- [ ] Laissez *Framework Preset* sur **Next.js** et ne touchez pas aux commandes.
- [ ] Dépliez **Environment Variables** et ajoutez ces deux lignes (nom à gauche, valeur à droite) :

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | la **Project URL** de l'étape 1.6 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la **Publishable key** de l'étape 1.6 |

  Astuce : le bloc `.env` proposé par Supabase (**Connect** → **App Frameworks** → **Next.js**) peut être collé tel quel dans ce formulaire : ses noms (`…PUBLISHABLE_KEY`, `…PUBLISHABLE_DEFAULT_KEY`) sont aussi acceptés.

- [ ] **Deploy**. Au bout de 2 à 3 minutes : **Congratulations!**
- [ ] Cliquez **Continue to Dashboard** et notez l'adresse du site sous **Domains**, par exemple `https://vybzstudios.vercel.app`.

---

## Étape 3 — Relier Supabase au site (2 min)

- [ ] Supabase → **Authentication** → **URL Configuration** :
  - *Site URL* : l'adresse de l'étape 2 (ex. `https://vybzstudios.vercel.app`) → **Save**
  - *Redirect URLs* → **Add URL** : la même adresse suivie de `/**` (ex. `https://vybzstudios.vercel.app/**`) → **Save**
- [ ] Recommandé, pour que « Mot de passe oublié » marche même si l'email est ouvert sur un autre appareil :
  **Authentication** → **Emails** → **Reset Password** → remplacez tout le contenu du message par :

```html
<h2>Nouveau mot de passe</h2>
<p><a href="{{ .SiteURL }}/auth/confirmer?token_hash={{ .TokenHash }}&type=recovery&suite=/admin/nouveau-mot-de-passe">Choisir un nouveau mot de passe</a></p>
```

  puis **Save changes**.

---

## Étape 4 — Vérifier (5 min)

- [ ] Sur un téléphone, ouvrez l'adresse du site : accueil, collection, une fiche produit.
- [ ] Faites une **commande test** (n'importe quelle chaussure, votre vrai numéro) → WhatsApp s'ouvre vers **+225 05 06 52 38 16** avec la commande `CMD-0001`. Inutile de l'envoyer.
- [ ] Ouvrez **l'adresse du site + `/admin`** (ex. `https://vybzstudios.vercel.app/admin`) → connectez-vous avec `angebattey.616@gmail.com`.
  Il ne doit **pas** y avoir de bandeau vert « Mode démo » en haut.
- [ ] Onglet **Commandes** : la commande test est là → touchez **Annulée**.
- [ ] Installez l'admin sur le téléphone du vendeur :
  - Android (Chrome) : menu **⋮** → **Installer l'application** (ou **Ajouter à l'écran d'accueil**)
  - iPhone (Safari) : bouton **Partager** → **Sur l'écran d'accueil**
- [ ] Donnez au vendeur : l'adresse du site, l'adresse de l'admin, son mot de passe et le fichier **GUIDE-VENDEUR.md**.

🎉 La boutique est en ligne. Chaque modification faite dans l'admin apparaît sur le site en quelques secondes, sans redéployer.

---

## Étape 5 — Chaque commande arrive avec la photo (20 min)

Un lien WhatsApp ne peut porter que du texte : c'est une règle de WhatsApp. Pour que le vendeur reçoive **à coup sûr**
la commande **avec une vraie photo de la chaussure** (pas un lien), le site l'envoie lui-même par l'API officielle de
WhatsApp. Pour chaque commande, le vendeur reçoit un message de la boutique : la photo, et toute la commande écrite
dessous, prête à transférer au livreur.

Pour commencer, Meta prête un **numéro de test gratuit**, qui peut écrire à 5 numéros au plus : celui du vendeur et les
autres numéros de l'onglet Numéros (frère, livreur…). Plus tard, la boutique peut prendre son propre numéro (une puce
qui n'est pas déjà sur WhatsApp) ; chaque message coûte alors quelques francs CFA.

### 5.1 Créer l'application WhatsApp

- [ ] Allez sur **developers.facebook.com** → connectez-vous avec Facebook → **Mes apps** → **Créer une app**.
- [ ] Nom : `Vertical Store`. Quand Meta demande ce que fera l'app, choisissez **WhatsApp**
  (ou le type **Entreprise**, puis ajoutez le produit **WhatsApp**). Liez-la au portefeuille d'entreprise proposé
  (ou créez-le : nom `Vertical Store`).
- [ ] Dans l'app : **WhatsApp** → **Configuration de l'API** (*API Setup*).

### 5.2 Le numéro qui envoie, et ceux qui reçoivent

- [ ] Sur cette page, sous le numéro de test, copiez l'**identifiant du numéro de téléphone** (*Phone number ID*,
  un long nombre) : c'est `WHATSAPP_NUMERO_ID`.
- [ ] Champ **À** (*To*) → **Gérer la liste des numéros** → ajoutez **+225 05 06 52 38 16**, puis chaque autre numéro
  de l'onglet Numéros qui peut devenir actif. Chaque numéro reçoit un code sur WhatsApp : entrez-le pour le valider.

### 5.3 Le modèle de message

- [ ] Allez sur **business.facebook.com** → **WhatsApp Manager** → **Modèles de messages** → **Créer un modèle**.
  - Catégorie : **Utilitaire** (*Utility*)
  - Nom : `nouvelle_commande`
  - Langue : **Français**
- [ ] **En-tête** : **Média** → **Image** (ajoutez une photo de chaussure comme exemple).
- [ ] **Corps** : copiez **exactement** ce texte (les `{{1}}` à `{{13}}` seront remplacés par la commande) :

```text
🛒 NOUVELLE COMMANDE VERTICAL STORE — {{1}}
👟 Chaussure : {{2}}
📏 Pointure : {{3}}
🔢 Quantité : {{4}}
💰 Prix : {{5}}
🚚 Livraison : {{6}}
✅ TOTAL : {{7}}
👤 Nom : {{8}}
📞 Numéro : {{9}}
📍 Lieu : {{10}}
🏠 Adresse : {{11}}
🧭 Repère : {{12}}
💳 Paiement : {{13}}

Commande passée sur le site Vertical Store.
```

- [ ] Meta demande un exemple pour chaque `{{…}}` : mettez n'importe quoi (`CMD-0001`, `Air Max 95`, `42`, `1`…).
- [ ] **Envoyer**. Au bout de quelques minutes, le modèle passe en **Actif** (*Approuvé*).

### 5.4 La clé permanente

La clé affichée sur la page *API Setup* ne dure que 24 heures : il en faut une permanente.

- [ ] **business.facebook.com** → **Paramètres** (de l'entreprise) → **Utilisateurs** → **Utilisateurs système** →
  **Ajouter** : nom `site`, rôle **Admin**.
- [ ] Sur cet utilisateur : **Attribuer des éléments** → **Apps** → `Vertical Store` → **Contrôle total**.
- [ ] **Générer un token** → app `Vertical Store` → expiration **Jamais** → cochez `whatsapp_business_messaging` et
  `whatsapp_business_management` → **Générer**. Copiez la clé tout de suite (elle ne sera plus affichée) :
  c'est `WHATSAPP_JETON`. Gardez-la secrète, comme un mot de passe.

### 5.5 Donner les deux valeurs au site

- [ ] Vercel → projet → **Settings** → **Environment Variables** → ajoutez :

| Name | Value |
| --- | --- |
| `WHATSAPP_JETON` | la clé permanente de l'étape 5.4 |
| `WHATSAPP_NUMERO_ID` | l'identifiant du numéro de l'étape 5.2 |

- [ ] **Deployments** → **⋯** → **Redeploy**.

### 5.6 Vérifier

- [ ] Faites une commande test sur le site. En quelques secondes, le WhatsApp du vendeur reçoit le message de la
  boutique : **la photo de la chaussure, avec la commande écrite dessous**. Le client, lui, voit toujours WhatsApp
  s'ouvrir avec son message.
- [ ] Le message part vers le **numéro actif** (onglet Numéros de l'admin). Avec le numéro de test, ce numéro doit
  être dans la liste de l'étape 5.2.

Si l'envoi échoue un jour (clé effacée, modèle refusé…), aucune commande n'est perdue : elle est enregistrée et le
client est guidé pour envoyer la photo lui-même depuis son téléphone. La raison s'affiche dans Vercel → projet →
**Logs** (« envoi WhatsApp au vendeur impossible »).

---

## Si quelque chose coince

| Ce que vous voyez | Ce qu'il faut faire |
| --- | --- |
| Vercel : le déploiement échoue avec « Lecture Supabase impossible » | Le script de l'étape 1.3 n'a pas été lancé, ou l'URL / la clé sont fausses. Corrigez dans Vercel → projet → **Settings** → **Environment Variables**, puis **Deployments** → **⋯** → **Redeploy**. |
| L'admin affiche « Mode démo » | Les deux variables manquent ou sont mal nommées dans Vercel. Ajoutez-les, puis **Redeploy**. |
| « Email ou mot de passe incorrect » | Vérifiez le compte dans Supabase → **Authentication** → **Users** (créé avec **Auto Confirm User** ?). |
| « Ce compte n'a pas accès à l'administration » | L'email n'est pas dans la liste des admins : voir `NOTES-TECHNIQUES.md`, section 6. |
| Le lien « Mot de passe oublié » dit que le lien a expiré | Refaites la demande et ouvrez le lien sur le même téléphone, ou faites l'étape 3 (modèle d'email). |
| Le vendeur reçoit la commande sans la photo de la boutique | Vercel → projet → **Logs** : cherchez « envoi WhatsApp au vendeur impossible ». Le plus souvent : modèle `nouvelle_commande` pas encore **Actif**, clé de 24 h au lieu de la clé permanente (étape 5.4), ou numéro actif absent de la liste du numéro de test (étape 5.2). |
| Après une semaine sans visite, le site ne charge plus les chaussures | Le projet Supabase gratuit s'est mis en pause : Supabase → projet → **Restore project**. |

## Bon à savoir

- **Vercel Hobby** est réservé à un usage non commercial. Dès que la boutique vend vraiment, passez au plan **Pro** (projet → **Settings** → **Billing**).
- **Plus rapide (facultatif)** : Vercel → projet → **Settings** → **Functions** → *Function Region* → **Paris (cdg1)**, à côté de la base Supabase, puis **Redeploy**.
- **Nom de domaine (facultatif)** : Vercel → projet → **Settings** → **Domains** → ajoutez le domaine et suivez les instructions. Ajoutez ensuite la nouvelle adresse dans Supabase (étape 3).
- **Mettre à jour le site** : chaque modification envoyée sur la branche `main` de GitHub est mise en ligne automatiquement par Vercel.
