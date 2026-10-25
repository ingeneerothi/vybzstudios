# Guide du vendeur — Vertical Store

Ce guide explique comment gérer la boutique depuis votre téléphone. Pas besoin de connaissances techniques.

---

## 1. Se connecter

1. Ouvrez votre navigateur (Chrome sur Android, Safari sur iPhone).
2. Allez sur l'adresse de la boutique, puis ajoutez **/admin** à la fin.
   Exemple : `https://vertical-store.vercel.app/admin`
3. Entrez votre **email** et votre **mot de passe**, puis touchez **Se connecter**.

Vous restez connecté : pas besoin de retaper le mot de passe à chaque fois.

> **Mot de passe oublié ?** Sur l'écran de connexion, touchez **Mot de passe oublié ?**, entrez votre email, puis ouvrez le lien reçu par email (regardez aussi dans les spams). Choisissez un nouveau mot de passe (8 caractères minimum).

---

## 2. Installer l'admin sur l'écran d'accueil

L'admin s'ouvre alors comme une application, avec l'icône Vertical Store.

- **Android (Chrome)** : connectez-vous, touchez le menu **⋮** en haut à droite, puis **Ajouter à l'écran d'accueil** (ou **Installer l'application**).
- **iPhone (Safari)** : connectez-vous, touchez le bouton **Partager** (carré avec une flèche), puis **Sur l'écran d'accueil**.

---

## 3. Le menu du bas

| Onglet | À quoi il sert |
| --- | --- |
| 👟 **Chaussures** | Ajouter, modifier, supprimer une chaussure, mettre en rupture |
| 📋 **Commandes** | Voir les commandes et les demandes d'articles, changer leur statut |
| 💬 **Numéros** | Choisir le numéro WhatsApp qui reçoit les commandes |
| ⚙️ **Réglages** | Zones et frais de livraison, slogan, chaussure vedette, mode de paiement |

---

## 4. Ajouter une chaussure

1. Onglet **Chaussures** → bouton **Ajouter une chaussure** (en bas).
2. **Photos** :
   - **Ajouter des photos** : choisissez une ou plusieurs photos (une vue par photo).
   - **Ajouter un montage** : une seule image qui contient plusieurs vues sur fond blanc ; le site la découpe tout seul.
   - Laissez **Retirer le fond blanc** activé : le fond blanc disparaît automatiquement.
   - La **1re photo** est la photo principale. Pour changer l'ordre, glissez la poignée ⋮⋮ ou utilisez les flèches ↑ ↓.
   - Touchez **Voir l'aperçu de la galerie** pour voir le rendu sur le site.
3. **Informations** : nom (ex. « Air Max 95 Kaki »), marque, couleur.
4. **Prix** : écrivez le prix en chiffres, sans espace (ex. `22000`).
5. **Stock et pointures** : par défaut, les pointures 39 à 47 sont proposées et en stock.
6. **Description** : touchez **✨ Générer la description** pour avoir un texte prêt. Touchez encore pour une autre proposition. Vous pouvez modifier le texte.
7. Touchez **Ajouter la chaussure**. Message : « Chaussure ajoutée ✅ ».

La chaussure apparaît sur le site en quelques secondes, avec le badge **Nouveau**.

> **Conseil photo** : des photos sur fond blanc uni donnent le meilleur résultat. Si une chaussure blanche perd un peu de son contour, désactivez « Retirer le fond blanc » et utilisez une photo déjà détourée (PNG transparent).

---

## 5. Mettre en rupture de stock

**Toute la chaussure** : onglet **Chaussures**, touchez l'interrupteur à droite de la chaussure.
- Vert = en stock. Gris = rupture : le site affiche « Rupture de stock » et la commande est impossible.

**Une seule pointure** : touchez la chaussure → section **Stock et pointures** → touchez la pointure.
- Pointure verte = en stock. Pointure barrée = rupture. Puis **Enregistrer les changements**.

Le site affiche « Plus que X pointures disponibles » seulement quand c'est vrai (3 pointures ou moins).

**Une pointure que vous n'avez jamais** (ex. le modèle s'arrête au 46) : **Changer les pointures proposées**, puis décochez-la.

---

## 6. Faire une réduction (promo)

1. Touchez la chaussure → section **Prix** → activez **Faire une réduction**.
2. Choisissez :
   - **Nouveau prix** : écrivez le prix promo (ex. `18000`), ou
   - **Pourcentage** : écrivez la réduction (ex. `20` pour -20 %).
3. Vérifiez la ligne « Sur le site : ~~22 000 FCFA~~ **17 600 FCFA** (-20%) ».
4. **Fin de la promo** (facultatif) : choisissez une date et une heure. Le site affiche un compte à rebours et le prix normal revient tout seul à la fin.
5. **Enregistrer les changements**.

Pour arrêter la promo : désactivez **Faire une réduction** puis enregistrez.

---

## 7. Changer le numéro WhatsApp qui reçoit les commandes

1. Onglet **Numéros**.
2. Le numéro **Actif** (encadré vert) reçoit toutes les commandes et demandes.
3. Pour changer : touchez **Activer** sur un autre numéro. C'est immédiat : « Numéro activé ✅ ».

**Ajouter un numéro** : **Ajouter un numéro** → nom (ex. « Mon frère ») → numéro (ex. `05 06 52 38 16`) → **Enregistrer**.
Numéro étranger : commencez par `+` et l'indicatif (ex. `+33 6 12 34 56 78`).

**Phrase au début des commandes** : pour un numéro autre que le vôtre (livreur, frère…), le champ est déjà rempli avec
« Bonjour c'est Ange ». Quand ce numéro est actif, chaque commande commence par cette phrase : la personne qui la reçoit
sait qu'elle vient de vous. Vous pouvez la changer, ou la vider (c'est le cas pour le numéro principal). Elle s'affiche
sous le numéro : « Commandes précédées de « Bonjour c'est Ange » ».

> Le numéro actif ne peut pas être supprimé : activez d'abord un autre numéro. Il y a toujours un numéro qui reçoit.

---

## 8. Modifier les frais de livraison

1. Onglet **Réglages** → **Zones et frais de livraison**.
2. Touchez le crayon ✏️ d'une zone pour changer son nom ou ses frais, puis **Enregistrer**.
3. **Ajouter une zone** : nom, frais, et ce qu'on demande au client :
   - *Grande ville* : commune et quartier (comme Abidjan) ;
   - *Ville proche* : quartier ;
   - *Expédition* : ville.

Les frais s'ajoutent tout seuls au total du client.

Dans **Boutique**, vous pouvez aussi changer le **slogan** de l'accueil, la **chaussure vedette** (la grande photo de l'accueil) et le **mode de paiement**.

---

## 9. Suivre les commandes

Quand un client commande :
1. Il remplit le formulaire sur le site.
2. Aussitôt, la boutique vous envoie la commande sur WhatsApp, au numéro actif : **la photo de la chaussure, avec
   toute la commande écrite dessous**. Exemple de texte sous la photo :

```
🛒 NOUVELLE COMMANDE VERTICAL STORE — CMD-0042
👟 Chaussure : Air Max 95 x Corteiz Kaki
📏 Pointure : 42
...
✅ TOTAL : 24 000 FCFA
```

3. Chez le client, WhatsApp s'ouvre avec le même message déjà écrit ; il touche **Envoyer**. Vous avez ainsi sa
   discussion pour organiser la livraison. Si un autre numéro que le vôtre est actif, ce message commence par sa
   phrase (ex. « Bonjour c'est Ange »).

Le message de la boutique (photo + commande) se **transfère tel quel au livreur** : appui long → **Transférer**.

Dans l'onglet **Commandes** :
- Les plus récentes sont en haut. Le chiffre rouge = nouvelles commandes.
- **Appeler** / **WhatsApp** : contacter le client.
- **Envoyer au livreur, avec la photo** : sur votre téléphone, la photo de la chaussure part comme une vraie photo,
  avec toute la commande écrite dessous. Choisissez le livreur dans WhatsApp, puis envoyez. (Sur ordinateur : la commande seule.)
- Touchez le statut : **Nouvelle**, **Envoyée au livreur**, **Livrée** ou **Annulée**.
- **Actualiser** (en haut) pour voir les dernières commandes.

**Demandes** : les clients qui ne trouvent pas leur chaussure envoient une photo. Touchez la photo pour l'agrandir, contactez le client, puis changez le statut.

> Le numéro de commande (CMD-0042) est le même dans WhatsApp et dans l'admin : pratique pour retrouver une commande.

---

## 10. Questions fréquentes

**Je ne vois pas mon changement sur le site.** Attendez quelques secondes puis rechargez la page. Si rien ne change après une minute, déconnectez-vous puis reconnectez-vous et recommencez.

**Une photo ne passe pas.** Utilisez une photo JPG ou PNG, de bonne qualité, sur fond blanc. Vérifiez votre connexion internet.

**Un client dit que la commande ne passe pas.** Vérifiez que la chaussure et la pointure sont en stock, et qu'un numéro WhatsApp est actif.

**J'ai supprimé une chaussure par erreur.** Il faut la recréer (photos, prix...). Les commandes déjà reçues restent visibles.
