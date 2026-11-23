# Où on en est — revue du 23/11/2026

Tout ce qui suit est en ligne (`main`, PR n°40 comprise ; Stripe en **mode test**). Vérifications GitHub vertes.
Tests : 615 tests automatiques (dont la sécurité de chaque table sur PostgreSQL) et 322 vérifications dans un navigateur (chaque écran à 320, 360 et 390 px).

## Écrans

**Accès et paiement**
- `/connexion`, `/mot-de-passe-oublie`, `/mot-de-passe/nouveau`, `/auth/confirm` : connexion et mot de passe (pas d'inscription libre).
- `/abonnement` : 49 €/mois ou 499 €/an, abonnement terminé, accès coupé ; `/bienvenue` : retour après paiement.
- Webhook Stripe : création du compte, prénom et nom, résiliation, impayé, doublon remboursé, formule.

**Espace membre** (barre d'onglets Accueil, Semaine, Ressources, Club, Avantages)
- `/accueil` : salutation, phase, zones, « Aujourd'hui » (séance du jour), « Bloc en cours » / « Fil rouge », « FAQ en visio », « Nouveau cette semaine ».
- `/semaine` : semaine du programme (séances du jour, coches des séances faites), décompte, semaines précédentes et suivantes ; `/seance/[id]` : blocs avec zone, allure et FC, « Marquer comme faite », ressenti (RPE, douleur, commentaire).
- `/saison` : objectifs, blocs S/M/L/XL, calendrier, J-xx.
- `/tests` (4 tests de départ), `/zones` (3 sports, zones personnalisables), `/progres` (courbes), `/records`.
- `/profil` : prénom, nom, abonnement, niveau, profil, liens (Ma saison, Mes records, Mes progrès, Calculateur, Mes zones, Refaire mes tests).
- `/ressources` : thèmes, sous-rubriques, PDF et vidéos débloqués selon l'ancienneté, favoris, vu / téléchargé, commentaires ; `/ressources/calculateur`.
- `/club` : canaux en direct, non-lus, « Mon bloc » ; `/club/questions` : boîte à questions sans votes ; `/club/agenda` : calendrier mensuel, « Ajouter à mon agenda ».
- `/avantages` : remises des partenaires, « Copier le code ».
- **Application installable** : icône sur l'écran d'accueil, plein écran, écran de démarrage, page « Pas de connexion » sans réseau, carte « Installer l'app » sur l'accueil (logo provisoire).

**Espace coach** (`/coach`, `/coach/athletes/[id]`) : liste des athlètes (prénom et nom, recherche, anciens membres), fiche en lecture seule (niveau, objectifs, séances avec RPE, douleur, commentaire, filtre douleurs).

**Espace admin** (`/admin`)
- `/admin/membres` : liste, recherche, accès offert ou coupé, renvoi d'e-mail, journal.
- `/admin/ressources` (+ `/themes`, `/commentaires`) : contenus, PDF, liens YouTube, miniatures, thèmes, modération.
- `/admin/questions` : préparer la FAQ (à traiter / traitées, copier la liste).
- `/admin/agenda` : événements ; `/admin/partenaires` : Avantages ; `/admin/composants` : vitrine.

## Base de données et sécurité

Sécurité par ligne active sur **les 22 tables** ; un visiteur non connecté n'a accès à **aucune**. Vérifié en ligne le 23/11.

| Table | Contenu | Qui lit | Qui écrit |
|---|---|---|---|
| `membres` | fiche, abonnement, accès | le membre la sienne ; l'admin toutes ; le coach seulement prénom, nom, niveau, profil par `coach_athletes()` | le membre : prénom, nom, niveau, profil ; abonnement : le serveur ; accès : fonctions admin |
| `tests`, `zones`, `objectifs`, `records` | tests, zones perso, courses, records | le membre les siens ; coach et admin tous | le membre, les siens |
| `ressentis` | séances faites, RPE, douleur, commentaire (**santé**) | le membre les siens ; coach et admin (lecture seule) | le membre, les siens (seulement le ressenti) |
| `seances`, `blocs_seance`, `programme` | programme d'entraînement | tout membre connecté | le serveur seulement |
| `themes_ressources`, `sous_rubriques` | thèmes des Ressources | tout membre connecté | admin |
| `ressources` | catalogue | tout membre connecté ; lien, fichier et miniature seulement si débloqué | admin |
| `suivi_ressources` | favoris, vu, téléchargé | le membre, le sien | le membre (contenus débloqués) |
| `commentaires_ressources` | commentaires sous les vidéos | membres ayant débloqué la vidéo | le membre, les siens ; l'admin supprime (journal) |
| `canaux` | 7 canaux du Club | tout membre connecté | personne (pas de canal privé possible) |
| `messages_club` | messages des canaux (temps réel) | tout membre connecté | le membre en son nom (annonces : admin et coach) ; supprime les siens, l'admin tous (journal) |
| `lectures_canaux` | non-lus | le membre, les siennes | seulement `marquer_canal_lu()` |
| `questions_faq` | boîte à questions (sans votes) | tout membre connecté | le membre en son nom ; l'admin traite ou supprime |
| `evenements` | agenda | tout membre connecté | admin |
| `partenaires` | Avantages | membres connectés (partenaires affichés) ; admin tous | admin |
| `journal_admin` | actions de l'admin | admin | seulement les fonctions admin |
| `stripe_evenements` | messages Stripe traités | serveur | serveur |

- **Fonctions protégées** (vérifient le rôle ou le déblocage) : `admin_offrir_acces`, `admin_couper_acces`, `admin_noter_email_acces`, `admin_changer_role`, `admin_changer_statut`, `admin_ressources`, `admin_supprimer_commentaire`, `admin_supprimer_message`, `coach_athletes`, `ressources_medias`, `fichier_ressource`, `fichier_debloque`, `ressource_debloquee`, `semaine_anciennete`, `canaux_non_lus`, `marquer_canal_lu`.
- **Stockage** : « ressources » (PDF, privé, 50 Mo, lu seulement si débloqué) et « miniatures » (public, 2 Mo) ; dépôt et suppression réservés à l'admin.
- **Preuves** : `tests/rls.test.ts` et un fichier `tests/securite-*.test.ts` par sujet (zones et tests, ressenti, ressources, admin des ressources, club, questions et agenda, coach, partenaires).

Points d'attention :
- Réglé : le coach ne lit plus l'e-mail ni Stripe ; les données de santé ont leur table protégée.
- Le temps réel du Club n'a pas encore été essayé en ligne entre deux appareils (les tests le coupent).
- Le Calculateur : le serveur vérifie si le site LCS accepte l'affichage intégré ; à regarder une fois en ligne.

## Ce qui manque

### Écarts avec la maquette
Plus aucun écart de structure : l'accueil a ses cartes « Aujourd'hui », « FAQ en visio » et « Nouveau cette semaine » (23/11), le bandeau des canaux mène à la boîte à questions. Restent les contenus listés plus bas (vidéos des tests, plans, ressources).

### Demandes encore ouvertes
4. ~~Application installable~~ : faite le 23/11 (logo provisoire : remplacer `marque/logo-provisoire.jpg`, puis `npm run icones`).
5. **Stripe en mode réel**, avant le 1er janvier 2027 :
   - produits, prix, liens de paiement, portail et webhook en mode réel ; variables Vercel ; un vrai paiement puis un remboursement ;
   - aligner la version des messages du webhook (2022 côté Stripe, 2025 dans le code).
6. **Saisie du programme par Martin** : aucun écran pour l'instant (la démo est écrite par migration) ; à prévoir dans l'admin, ou par import d'un tableur.
7. **Canaux bloc-s et bloc-xl** : seuls bloc-m et bloc-l existent (à confirmer).

### Contenus à fournir
8. **Programme** : les vrais plans de Martin (fil rouge et blocs S/M/L/XL, par niveau et profil) ; toutes les séances actuelles sont des démos (`de000000-…`).
9. **Ressources** : 3 contenus sur 17 ont déjà leur vidéo ou leur PDF ; les autres affichent « bientôt disponible ».
10. **Tests de départ** : les vidéos « Voir la vidéo » de la maquette (une par test).
11. **Agenda** : les vraies dates (exemples en janvier 2027) ; **Avantages** : les vrais codes (Pyrène et Onatera sont des codes d'exemple).
12. **Polices** : les fichiers Tussilago Bold et Helvetica Neue LT Pro (Archivo et Inter en attendant).

## Ordre conseillé

1. Saisie du programme par Martin (6), puis ses plans et ses contenus (8 à 11).
2. Stripe en mode réel vers la mi-décembre (5).
