# Où on en est — revue du 20/11/2026

Tout ce qui suit est en ligne sur le site (Stripe en **mode test**). Vérifications GitHub vertes sur `main`.

## Écrans

**Accès et paiement**
- `/connexion`, `/mot-de-passe-oublie`, `/mot-de-passe/nouveau`, `/auth/confirm` : connexion et mot de passe (pas d'inscription libre).
- `/abonnement` : choix 49 €/mois ou 499 €/an, abonnement terminé, accès coupé.
- `/bienvenue` : retour après paiement.
- Webhook Stripe : création du compte, résiliation, impayé, doublon remboursé, formule.

**Espace membre** (barre d'onglets, aussi sur les sous-pages)
- Faits :
  - `/accueil` : salutation, phase, zones, carte « Bloc en cours » ;
  - `/semaine` : dates, phase, niveau et profil, décompte, bande des 7 jours, séances du jour (programme), semaines précédentes et suivantes (de l'inscription à la fin de la période payée) ;
  - `/seance/[id]` : blocs de la séance avec zone, allure et FC du membre (cadenas sans tests), « Marquer comme faite » et ressenti (RPE, douleur, commentaire) ;
  - `/saison` : objectifs, blocs S/M/L/XL, calendrier, nom de course, J-xx ;
  - `/tests` : 4 tests de départ ;
  - `/zones` : 3 sports, zones personnalisables, niveau et profil ;
  - `/profil` : prénom, abonnement, niveau, profil, liens.
  - `/progres` : courbe par sport (course, vélo, natation, cardio), gain depuis le premier test, historique ;
  - `/records` : 10 km, semi, marathon, triathlon S à XL, tous facultatifs.
  - `/ressources` : 5 thèmes avec icône, sous-rubriques, PDF et vidéos (YouTube non répertorié) débloqués selon l'ancienneté, favoris, « Vue » / « Téléchargé », commentaires sous les vidéos.
  - `/club` : canaux collectifs en direct (annonces réservé à l'équipe et au coach), badges de non-lus, « Mon bloc », suppression de ses messages (l'admin supprime tout) ; pas de messages privés.
  - `/club/questions` : boîte à questions sans votes, prochaine FAQ en visio ; `/club/agenda` : calendrier mensuel, « Ajouter à mon agenda » (.ics).
- `/admin/questions` (préparer la FAQ) et `/admin/agenda` (créer et modifier les événements).
- Écrans « bientôt » (vides) : `/avantages`.

**Espace équipe**
- `/admin` et `/admin/membres` : liste, recherche, accès offert ou coupé, renvoi d'e-mail, journal.
- `/admin/ressources` : contenus (PDF, lien YouTube, miniature, semaine de déblocage), thèmes et sous-rubriques, modération des commentaires.
- `/admin/composants` : vitrine des composants.
- `/coach` : liste des athlètes (prénom et nom, recherche, anciens membres) et fiche en lecture seule (niveau, objectifs, séances avec RPE, douleur et commentaire, filtre douleurs).

## Base de données et sécurité

Sécurité par ligne active sur les 21 tables ; les visiteurs non connectés n'ont accès à rien.

| Table | Contenu | Qui lit | Qui écrit |
|---|---|---|---|
| `membres` | fiche, abonnement, accès | le membre la sienne ; admin toutes ; le coach seulement prénom, nom, niveau, profil par `coach_athletes()` | le membre : prénom, nom, niveau, profil seulement ; abonnement : le serveur ; accès : fonctions admin |
| `tests` | tests de départ | le membre les siens ; coach et admin tous | le membre, les siens |
| `zones` | zones personnalisées | idem | le membre, les siennes |
| `objectifs` | courses de la saison | idem | le membre, les siens |
| `records` | records personnels (10 km… triathlon XL) | idem | le membre, les siens |
| `themes_ressources`, `sous_rubriques` | thèmes et sous-rubriques des Ressources | tout membre connecté | admin |
| `ressources` | catalogue (lien vidéo, fichier et miniature jamais lisibles directement) | tout membre connecté ; liens seulement si débloqué | admin |
| `suivi_ressources` | favoris, vu, téléchargé | le membre, le sien | le membre, le sien (contenus débloqués) |
| `commentaires_ressources` | commentaires sous les vidéos | les membres qui ont débloqué la vidéo | le membre, les siens ; l'admin supprime (noté au journal) |
| `canaux` | les 7 canaux du Club | tout membre connecté | personne (migration seulement : pas de canal privé) |
| `messages_club` | messages des canaux | tout membre connecté | le membre en son nom (annonces : admin et coach) ; supprime les siens, l'admin tous (noté au journal) |
| `lectures_canaux` | dernière lecture de chaque canal | le membre, les siennes | seulement par `marquer_canal_lu()` |
| `questions_faq` | questions pour la FAQ en visio (sans votes) | tout membre connecté | le membre en son nom, retire les siennes ; l'admin marque traitée ou supprime |
| `evenements` | agenda du Club | tout membre connecté | admin |
| `ressentis` | séances faites, RPE, douleur, commentaire (**données de santé**) | idem | le membre, les siens (seulement RPE, douleur, commentaire une fois la ligne créée) |
| `journal_admin` | trace des actions admin | admin | seulement les fonctions admin |
| `stripe_evenements` | messages Stripe traités | serveur | serveur |
| `seances`, `blocs_seance`, `programme` | programme d'entraînement (pas de donnée personnelle) | tout membre connecté | serveur seulement |

Fonctions protégées (vérifient le rôle admin) : `admin_offrir_acces`, `admin_couper_acces`, `admin_noter_email_acces`, `admin_changer_role`, `admin_changer_statut`.
Preuves : `tests/rls.test.ts` et `tests/securite-tests-zones.test.ts`.

Points d'attention :
- Réglé (23/11) : le coach ne lit plus la fiche entière des membres ; il passe par `coach_athletes()` (prénom, nom, niveau, profil, ancienneté, accès en cours).
- Données de santé (RPE, douleur, commentaires) : table `ressentis` faite, lisible par le membre, le coach et l'admin (lecture seule), jamais par les autres membres ; prouvé par les tests de sécurité.

## Ce qui manque (demandes 1 à 9)

1. **Mes progrès** : fait (23/11), avec le bouton « Voir mon évolution » sous Mes zones. **Mes records** : fait.
2. **Ma saison** : fait. **Calculateur LCS** : à faire (outil du site dans l'app, accès depuis Profil et Ressources).
3. **Accueil** : phase et carte du bloc faites. Restent :
   - « Voir la vidéo » (attend les vidéos de Martin) ;
   - les cartes « Aujourd'hui », « FAQ en visio » et « Nouveau cette semaine » (dépendent de 5, 6 et 7).
4. **Espace coach** : fait (23/11) : liste avec recherche, fiche en lecture seule, filtre douleurs. Nom de famille ajouté (Profil et paiement).
5. **Club** : canaux en temps réel, boîte à questions sans votes et agenda faits (23/11).
   - Exemples d'agenda en janvier 2027 à remplacer par les vraies dates depuis `/admin/agenda`.
   - Canaux bloc S et bloc XL à ajouter si besoin (seuls bloc-m et bloc-l existent).
6. **RPE et douleur** : fait (23/11) : « Marquer comme faite » et ressenti dans l'écran Séance, table de santé protégée.
   - Tables du programme et vue Semaine faites (23/11), avec une semaine de démonstration par niveau (fil rouge, semaine 1, une séance chaque jour).
   - **Reste bloquant : les vrais plans de Martin** (fil rouge et blocs S/M/L/XL, par niveau et profil), et un moyen pour lui de les saisir.
7. **Ressources** : faites (23/11) : thèmes, PDF et vidéos, déblocage par ancienneté, favoris, vu / téléchargé, commentaires.
   - Écran admin fait (23/11) : contenus, thèmes, sous-rubriques, modération. Reste : remplacer la démo par les vrais PDF et vidéos de Martin.
8. **Application installable (PWA)** : à faire (manifeste, icônes, écran de démarrage, hors ligne).
9. **Stripe en mode réel** : à faire avant le 1er janvier 2027.
   - Produits, prix, liens de paiement, portail et webhook en mode réel ; variables Vercel ; vrai paiement puis remboursement.
   - Aligner la version des messages du webhook (2022 côté Stripe, 2025 dans le code).

Hors liste : « Avantages » est encore vide.

## Ordre conseillé

1. Sans contenu de Martin : Calculateur, application installable.
2. Puis le Calculateur, l'onglet Avantages et l'application installable.
3. Espace coach complet et RPE : quand le programme existe.
4. Stripe en mode réel vers la mi-décembre.
