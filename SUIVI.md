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
- Écrans « bientôt » (vides) : `/ressources`, `/club`, `/avantages`.

**Espace équipe**
- `/admin` et `/admin/membres` : liste, recherche, accès offert ou coupé, renvoi d'e-mail, journal.
- `/admin/composants` : vitrine des composants.
- `/coach` : vide (texte d'attente).

## Base de données et sécurité

Sécurité par ligne active sur les 11 tables ; les visiteurs non connectés n'ont accès à rien.

| Table | Contenu | Qui lit | Qui écrit |
|---|---|---|---|
| `membres` | fiche, abonnement, accès | le membre la sienne ; coach et admin toutes | le membre : prénom, niveau, profil seulement ; abonnement : le serveur ; accès : fonctions admin |
| `tests` | tests de départ | le membre les siens ; coach et admin tous | le membre, les siens |
| `zones` | zones personnalisées | idem | le membre, les siennes |
| `objectifs` | courses de la saison | idem | le membre, les siens |
| `records` | records personnels (10 km… triathlon XL) | idem | le membre, les siens |
| `ressentis` | séances faites, RPE, douleur, commentaire (**données de santé**) | idem | le membre, les siens (seulement RPE, douleur, commentaire une fois la ligne créée) |
| `journal_admin` | trace des actions admin | admin | seulement les fonctions admin |
| `stripe_evenements` | messages Stripe traités | serveur | serveur |
| `seances`, `blocs_seance`, `programme` | programme d'entraînement (pas de donnée personnelle) | tout membre connecté | serveur seulement |

Fonctions protégées (vérifient le rôle admin) : `admin_offrir_acces`, `admin_couper_acces`, `admin_noter_email_acces`, `admin_changer_role`, `admin_changer_statut`.
Preuves : `tests/rls.test.ts` et `tests/securite-tests-zones.test.ts`.

Points d'attention :
- Le coach lit la fiche entière des membres, y compris l'e-mail et les identifiants Stripe : prévoir une vue limitée pour l'espace coach.
- Données de santé (RPE, douleur, commentaires) : table `ressentis` faite, lisible par le membre, le coach et l'admin (lecture seule), jamais par les autres membres ; prouvé par les tests de sécurité.

## Ce qui manque (demandes 1 à 9)

1. **Mes progrès** : fait (23/11), avec le bouton « Voir mon évolution » sous Mes zones. **Mes records** : fait.
2. **Ma saison** : fait. **Calculateur LCS** : à faire (outil du site dans l'app, accès depuis Profil et Ressources).
3. **Accueil** : phase et carte du bloc faites. Restent :
   - « Voir la vidéo » (attend les vidéos de Martin) ;
   - les cartes « Aujourd'hui », « FAQ en visio » et « Nouveau cette semaine » (dépendent de 5, 6 et 7).
4. **Espace coach** : à faire.
   - Liste des athlètes ; fiche avec niveau, objectifs et séances (RPE, douleur, commentaire), en lecture seule.
   - Les droits de lecture sont prêts.
5. **Club** : à faire.
   - Canaux (annonces en lecture seule, général, présentations, un par bloc, nutrition-matos, courses), messages en temps réel.
   - Boîte à questions sans votes, FAQ en visio, agenda.
   - Tables, temps réel et règles de sécurité à créer.
6. **RPE et douleur** : fait (23/11) : « Marquer comme faite » et ressenti dans l'écran Séance, table de santé protégée.
   - Tables du programme et vue Semaine faites (23/11), avec une semaine de démonstration par niveau (fil rouge, semaine 1, une séance chaque jour).
   - **Reste bloquant : les vrais plans de Martin** (fil rouge et blocs S/M/L/XL, par niveau et profil), et un moyen pour lui de les saisir.
7. **Ressources** : à faire.
   - Thèmes, fiches vidéo ou PDF, déblocage par semaine d'abonnement, favoris, contenus vus, commentaires.
   - Tables et stockage des fichiers à créer.
8. **Application installable (PWA)** : à faire (manifeste, icônes, écran de démarrage, hors ligne).
9. **Stripe en mode réel** : à faire avant le 1er janvier 2027.
   - Produits, prix, liens de paiement, portail et webhook en mode réel ; variables Vercel ; vrai paiement puis remboursement.
   - Aligner la version des messages du webhook (2022 côté Stripe, 2025 dans le code).

Hors liste : « Avantages » est encore vide.

## Ordre conseillé

1. Sans contenu de Martin : Calculateur, application installable.
2. Puis Club (canaux et boîte à questions), puis Ressources.
3. Espace coach complet et RPE : quand le programme existe.
4. Stripe en mode réel vers la mi-décembre.
