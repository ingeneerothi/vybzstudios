# Cut & Care Styling — site de réservation

Site vitrine animé + tunnel de réservation (au salon ou à domicile) avec **acompte de 30 %** payé par **Wave** ou **Orange Money**.

- Une seule page, animée avec GSAP (ScrollTrigger, SplitText) et Lenis, en suivant les règles du skill `hyperframes-animation`.
- Un petit serveur Node **sans dépendance** : fichiers du site, API de réservation, paiements, tableau de bord du salon.
- Les prix, horaires, durées et zones à domicile sont dans **un seul fichier** : `public/data/catalog.json`.

## Lancer le site en local

Node.js 20 ou plus récent est nécessaire.

```bash
cd cut-and-care-site
npm start            # http://localhost:3000
npm test             # tests (prix, créneaux, téléphone, validation, signature Wave)
```

Les bibliothèques et polices sont déjà copiées dans `public/vendor` et `public/fonts` : pas besoin de `npm install` pour lancer le site.
`npm install && npm run vendor` sert seulement à les mettre à jour.

Sans clé de paiement, le site démarre en **mode démo** : le bouton « Payer » ouvre une page de paiement simulé et aucune somme n'est débitée.
Le badge « Mode démo · paiement simulé » est alors affiché dans le tunnel.

## Organisation

| Dossier / fichier | Rôle |
| --- | --- |
| `public/index.html`, `public/css/style.css` | La page et son style (mobile d'abord) |
| `public/js/app.mjs` | Rendu des sections depuis le catalogue + chorégraphie des animations |
| `public/js/booking.mjs` | Tunnel : prestation → lieu → créneau → coordonnées → acompte → confirmation |
| `public/js/fx.mjs` | Briques d'animation (tracés SVG, cascade, compteurs, confettis, ressorts…) |
| `public/js/pricing.mjs`, `slots.mjs`, `phone.mjs` | Calculs partagés navigateur / serveur (prix, acompte, créneaux, numéros) |
| `public/data/catalog.json` | Prix, durées, horaires, zones à domicile, textes des conditions |
| `server/index.mjs` | Serveur HTTP, API, webhooks, pages démo et admin |
| `server/payments/wave.mjs`, `orange.mjs` | Connexion aux API Wave et Orange Money |
| `server/data/bookings.json` | Réservations (créé au premier lancement, ignoré par git) |
| `tools/` | Préparation des images / vidéo et copie des bibliothèques |

## Modifier les prix, horaires et durées

Tout se règle dans `public/data/catalog.json`, sans toucher au code :

- `services` : nom, prix (F CFA), durée en minutes, photo.
- `booking.bookableWeekdays` : jours réservables en ligne (0 = dimanche … 6 = samedi). Aujourd'hui mardi → vendredi (offre semaine).
- `booking.hours` : ouverture / fermeture par jour. `capacity` : nombre de clientes coiffées en même temps.
- `booking.leadTimeHours` : délai minimum avant un rendez-vous. `horizonDays` : jusqu'où le calendrier s'ouvre.
- `homeService.zones` : quartiers servis à domicile et frais de déplacement (`fee: null` = « à confirmer »).
- `studentDiscount` : −33 % élèves / étudiant·e·s sur les tresses.
- `payments.manual` : numéros Wave / Orange Money pour le mode manuel (voir plus bas).

Le serveur recalcule toujours le montant de l'acompte à partir de ce fichier : le prix envoyé par le navigateur n'est jamais utilisé.
Redémarrer le serveur après une modification.

## Paiement de l'acompte : trois façons de fonctionner

Le mode est choisi automatiquement au démarrage (le terminal l'affiche).

1. **Wave / Orange Money automatiques (recommandé)** : la cliente est envoyée vers Wave ou Orange Money, paie, revient sur le site et voit sa confirmation. Le salon n'a rien à vérifier.
2. **Manuel** : renseigner les numéros du salon dans `payments.manual` du catalogue. La cliente reçoit le montant et le numéro, paie depuis son téléphone puis envoie la capture sur WhatsApp. Le salon valide la réservation dans `/admin`.
3. **Démo** : aucun moyen configuré, paiement simulé pour tester le parcours.

### Wave Business

1. Ouvrir un compte **Wave Business** et demander l'accès à l'API Checkout.
2. Dans le portail Wave Business → Développeurs : créer une **clé API** (droit « Checkout ») et un **webhook** vers `https://VOTRE-DOMAINE/api/webhooks/wave` (événements `checkout.session.completed` et `checkout.session.payment_failed`).
3. Copier `.env.example` en `.env` puis renseigner `WAVE_API_KEY` et `WAVE_WEBHOOK_SECRET`.

Wave n'a pas d'environnement de test : faire un premier essai réel avec un petit montant.

### Orange Money (Web Payment)

1. Créer une application sur **developer.orange.com** et souscrire à l'API « Orange Money Web Payment » pour la Côte d'Ivoire (un compte marchand Orange Money est nécessaire).
2. Renseigner dans `.env` : `ORANGE_AUTH_HEADER` (« Basic … » fourni par Orange), `ORANGE_MERCHANT_KEY`.
3. Tester avec `ORANGE_ENV=dev` (bac à sable), puis passer en `ORANGE_ENV=live` après validation par Orange.

> Les noms exacts des champs des API Wave et Orange Money sont repris de leur documentation publique ; ils sont à confirmer avec vos accès (premier paiement de test).

### Sécurité des paiements

- Le site ne demande **jamais** de code secret : la cliente valide toujours dans l'application Wave ou Orange Money.
- Le paiement est confirmé côté serveur (webhook signé pour Wave, relecture du statut chez Wave / Orange), jamais à partir de l'adresse de retour.
- Le montant reçu est comparé à l'acompte attendu.
- Un créneau est bloqué 30 minutes pendant le paiement, puis libéré si rien n'est payé.

## Mettre le site en ligne

Il faut un hébergement **Node.js** avec un nom de domaine en **HTTPS** (obligatoire pour Wave, Orange Money et les webhooks) et un **disque persistant** pour `server/data/`.
Exemples : Render, Railway, Fly.io, ou un petit VPS avec Nginx.

Variables à définir chez l'hébergeur (voir `.env.example`) :

- `PUBLIC_URL=https://votre-domaine.ci`
- `TRUST_PROXY=1` (le serveur est derrière le proxy de l'hébergeur)
- `ADMIN_TOKEN=` une longue chaîne aléatoire
- les clés Wave / Orange Money
- `BOOKINGS_FILE` vers le disque persistant si besoin

Commande de démarrage : `npm start`.

## Tableau de bord du salon

`https://votre-domaine/admin?token=VOTRE_ADMIN_TOKEN` : liste des réservations (date, prestations, cliente, adresse à domicile, montants), boutons « Acompte reçu » et « Annuler ».
Garder ce lien privé.

## Animations (skill hyperframes-animation)

Chaque section a sa timeline GSAP, jouée à l'entrée dans l'écran ou pilotée par le défilement (scrub). Règles appliquées :

- **logo-assemble-lockup** : le logo en croix de l'enseigne s'assemble au chargement (lettres en cascade, « S » et « YLING » qui tombent) et se reconstruit dans le pied de page.
- **titlecard-reveal + svg-path-draw** : titre du haut révélé par masque, arche dorée tracée, photo dévoilée par `clip-path`.
- **waterfall-entry** : titres découpés en mots (SplitText), créneaux horaires, menu mobile.
- **counting-dynamic-scale + stat-bars-and-fills** : prix qui défilent, anneau « 30 % d'acompte », acompte du ticket.
- **depth-scatter-assemble** : cartes de prix qui s'assemblent en profondeur.
- **split-tilt-cards** : cartes « Au salon / À domicile » en miroir, inclinaison 3D au survol.
- **device-surface-showcase** : le téléphone de la vidéo pivote avec le défilement.
- **particle-burst** : confettis à la confirmation (positions calculées, sans hasard).
- **press-release-spring** : boutons qui s'enfoncent puis rebondissent.
- **gradient-text-sweep** : reflet doré sur « Offre semaine ».
- Galerie horizontale épinglée, vapeur au-dessus des tasses, poussière dorée, curseur personnalisé, ouverture du tunnel en iris depuis le bouton cliqué.

Les personnes qui ont activé « réduire les animations » sur leur téléphone voient la page directement dans son état final.

## À confirmer par le salon

Plusieurs valeurs du catalogue sont provisoires (`hoursConfirmed`, `durationsConfirmed`, `feeConfirmed` à `false`) : horaires, durées, frais de déplacement par quartier, conditions d'annulation et de remboursement de l'acompte.
