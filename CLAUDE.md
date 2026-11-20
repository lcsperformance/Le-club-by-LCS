# CLAUDE.md — Le Club by LCS

## Projet

**Le Club by LCS** : application d'abonnement mensuel pour triathlètes, coachés par **Martin**.

- Abonnement : **49 € / mois, sans engagement**.
- Lancement : **1er janvier 2027**.

## Stack

- **Next.js** + **TypeScript**
- **Supabase** : authentification, base de données, temps réel, stockage
- **Stripe** : paiements et abonnements
- **Resend** : e-mails
- **Vercel** : déploiement
- Application web **installable sur téléphone** (PWA)

## Langue et formats

- Interface entièrement en **français**.
- Dates et heures au **format français** (ex. `18/11/2026`, `14 h 30`), fuseau **Europe/Paris**.

## Design

La maquette est dans le dossier `maquette/`. Respecter le style **Neon Glassmorphism** de `maquette/Main-neon.dc.html` :

- Mode sombre sur fond **#090A0F**.
- Cartes en **verre fumé translucide avec flou** (backdrop blur).
- **Bordure dégradée de 1 px**.
- **Lueur interne** sur les cartes.
- **Ombre colorée** sous les boutons principaux.
- **Barre d'onglets flottante**.

### Couleurs

| Nom     | Valeur    |
|---------|-----------|
| Aurore  | `#FA94FF` |
| Pourpre | `#C980B1` |
| Abysse  | `#191E39` |
| Cendre  | `#0C1321` |
| Accent  | `#DEFD62` |
| Texte   | `#F4EEFF` |
| Fond    | `#090A0F` |

### Typographie

- Titres : **Tussilago Bold** (en attendant les fichiers : Archivo 800, version large)
- Texte : **Helvetica Neue LT Pro** (en attendant : Inter)

## Règles métier

- **Pas d'appel direct entre athlète et coach** : uniquement les canaux collectifs et la boîte à questions (**sans votes**).
- Le coach voit l'historique d'un athlète **en lecture seule**.
- Le **RPE**, la **douleur** et les **commentaires** sont des **données de santé** : accès restreint (sécurité au niveau des lignes dans Supabase, jamais exposés à d'autres membres).
- Le programme **n'est jamais téléchargeable en PDF** : il reste dans l'app.
- Les ressources se **débloquent selon l'ancienneté** du membre.
- L'athlète **choisit lui-même** :
  - son **niveau** : Finisher, Challenger, Performer ;
  - son **profil** : extensif, intensif.

## Méthode de travail

1. **Avant chaque étape** : proposer un plan court et **attendre l'accord** avant de coder.
2. **Après chaque étape** :
   - lancer les tests ;
   - expliquer **en une phrase simple** ce qui marche ;
   - faire un **commit**.

## Commandes

- `npm run dev` : lancer l'app en local
- `npm test` : tests (Vitest ; les tests de sécurité RLS utilisent une base PostgreSQL locale via `TEST_DATABASE_URL`)
- `npm run typecheck` / `npm run lint` / `npm run build`
- `npm run test:e2e` (après `npm run build`) : vérifie dans un navigateur que chaque écran tient sur un téléphone (320, 360, 390 px). Les écrans connectés sont testés via les pages d'aperçu `/apercu-espace/…` et `/apercu-membre/…` (données fictives, actives seulement avec `APERCU=1`, jamais en production). Tout nouvel écran doit y être ajouté.

- `npm run test:paiement` : parcours de paiement de bout en bout avec les faux paiements Stripe (mode test → webhook en ligne → Supabase en ligne) ; hors vérifications GitHub ; nettoie tout à la fin. Variables : `STRIPE_SECRET_KEY` (sk_test_…), `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`.

- Vérifications automatiques GitHub (`.github/workflows/verifications.yml`) à chaque pull request : zones, lint, types, tests (avec PostgreSQL), compilation, affichage mobile. Ne pas fusionner si une croix rouge apparaît.

## Repères techniques

- Next.js 16 : lire `AGENTS.md` et la doc dans `node_modules/next/dist/docs/` avant d'écrire du code (ex. `middleware` s'appelle désormais `proxy`, fichier `src/proxy.ts`).
- Connexions Supabase : `src/lib/supabase/client.ts` (navigateur) et `server.ts` (serveur).
- Toute modification de la base passe par un nouveau fichier dans `supabase/migrations/`, avec la sécurité par ligne activée et testée dans `tests/rls.test.ts` (base de test commune : `tests/aide/base-de-test.ts`). Toute nouvelle table de données personnelles doit être ajoutée à la preuve `tests/securite-tests-zones.test.ts` (lecture, modification, suppression, écriture au nom d'un autre). Appliquer avec `npm run migrations -- appliquer` (jamais à la main), puis vérifier avec `npm run migrations -- etat`. Attention : sur ce projet Supabase, une nouvelle table ne donne **aucun droit** par défaut, ni aux membres (`authenticated`) ni au serveur (`service_role`) : chaque migration accorde explicitement les droits nécessaires (la base de test `tests/supabase-shim.sql` reproduit ce comportement).
- Dates : utiliser `src/lib/dates.ts` (fuseau Europe/Paris), dont `dateDuJourParis()` pour les colonnes `date`.
- Tests de départ : mesures, pas et limites dans `src/lib/tests-depart.ts` ; écran `/tests` ; un test par membre et par jour (upsert).
- Historique des tests : `historiqueSport(sport, membreId?)` dans `src/lib/historique-serveur.ts` (course, velo, natation, cardio), classé de la plus ancienne à la plus récente ; mise en forme testable dans `src/lib/historique.ts`.
- Zones : pourcentages dans `config/zones.json` (modifiable par Martin, validé avant chaque compilation par `npm run verifier-config`, logique dans `src/lib/config-zones.ts`), calculs dans `src/lib/zones.ts`, écran `/zones?sport=course|velo|natation`. Ne jamais écrire ces pourcentages en dur dans le code.
- Zones personnalisées : table `zones` (une ligne par membre et par sport, 6 bornes vérifiées par `bornes_valides`), règles dans `src/lib/zones-perso.ts`. Pas de ligne = valeurs du Club ; « Revenir aux valeurs du Club » supprime la ligne. La FC n'est pas personnalisable.
- Niveau et profil : choisis par le membre (jamais de valeur par défaut), enregistrés dès qu'il touche une option (`ChoixNiveauProfil`, action `enregistrerChoix`), sous « Mes zones » et sur `/profil`. Le Profil propose aussi Mes records (`/records`) et Mes progrès (`/progres`), pour l'instant des écrans « bientôt » (`EcranBientot`). Textes dans `config/profils.json` (validé par `npm run verifier-config`, logique dans `src/lib/config-profils.ts`).
- Ma saison (`/saison`) : objectifs du membre dans la table `objectifs` (bloc S, M, L, XL, `date_objectif` et `nom` facultatif, 60 caractères au plus : `lireNomCourse`, titre affiché `titreObjectif` = le nom, sinon « Triathlon M »). Durées des blocs dans `config/blocs.json` (validé par `npm run verifier-config`, logique dans `src/lib/config-blocs.ts`) ; S et XL sont provisoires. Règles testables dans `src/lib/saison.ts` (début du bloc = course − durée, statut, démarrage en cours de route, chevauchement : la course la plus proche mène, décompte « J-xx » / « Jour J », phase « Fil rouge » ou « Bloc M, semaine 3/12 »), lecture `lireObjectifs` dans `src/lib/saison-serveur.ts`, actions dans `src/app/(membre)/saison/actions.ts`. Le décompte (`CarteDecompte`) est aussi en haut de Ma semaine ; l'accueil affiche la phase (`phaseCourte`) et la carte « Bloc en cours » / « Fil rouge » (`carteAccueil`). Ma semaine : jours et titre dans `src/lib/semaine.ts`, bande des 7 jours `BandeJours`. Calendrier réutilisable : `CalendrierMois` (`@/components/ui`).
- Abonnement Stripe (mode test) : webhook `src/app/api/stripe/webhook/route.ts`, règles testables dans `src/lib/abonnement/` (`etat.ts`, `webhook.ts` avec dépendances injectées, `dependances.ts` pour les vrais services). Accès membre jusqu'à `membres.abonnement_fin` (`aAcces`), sinon `exigerRole` renvoie vers `/abonnement`. Seul le serveur (clé secrète Supabase, `src/lib/supabase/admin.ts`) écrit l'abonnement ; jamais de clé secrète côté navigateur. Chaque cas de bord a son test dans `tests/abonnement.test.ts`. Deux formules (49 €/mois, 499 €/an) : prix dans `src/lib/abonnement/formules.ts`, choix sur `/abonnement` (`ChoixFormule`), formule en cours dans `membres.formule` (écrite par le webhook), changement de formule via le portail Stripe.
- Prénom : colonne `membres.prenom` (modifiable par le membre, champ `ChampPrenom` dans le Profil), rempli au paiement à partir du nom Stripe s'il est vide (`prenomDepuisNom`, `src/lib/prenom.ts`). Accueil : `EnTeteAccueil` (« Salut Caroline », ou « Salut ! »).
- Espace admin « Membres » (`/admin/membres`, réservé à l'admin) : liste, recherche (prénom, e-mail), statut, niveau, ancienneté (`src/lib/admin/membres.ts`). Accès manuel : `membres.acces_offert_jusqua` (accès offert jusqu'à une date) et `membres.acces_coupe` (bloque même un abonnement payé), jamais touchés par le webhook ; pris en compte par `aAcces`. Écriture uniquement par les fonctions `admin_offrir_acces`, `admin_couper_acces`, `admin_noter_email_acces` (vérifient le rôle admin), tracées dans `journal_admin`. Couper l'accès programme aussi la résiliation Stripe en fin de période. Toute page sous `/admin` doit appeler `exigerRole("admin")` (vérifié par `tests/admin-membres.test.ts`).
- Rôles `membre`, `coach`, `admin` (colonne `membres.role`). Une page protégée appelle `exigerRole(...)` de `src/lib/auth.ts` dans un composant placé sous `<Suspense>` (Cache Components activé).
- Pas d'inscription libre : jamais de `signUp` dans l'app.
- Écrans : séparer l'affichage (composant qui reçoit les données) de la lecture en base (page), pour pouvoir l'afficher dans les aperçus.
- Composants Neon dans `src/components/ui` (import depuis `@/components/ui`) : `Carte`, `BoutonPrincipal`, `BoutonSecondaire`, `Champ`, `Compteur` (− valeur +), `PastilleZone`, `CalendrierMois`. Les utiliser plutôt que de recopier des styles ; vitrine sur `/admin/composants`.
- Fond : `FondNeon`. Espace membre dans `src/app/(membre)` avec la `BarreOnglets` (onglets définis dans `src/lib/onglets.ts`) : affichée sur les 5 pages d'onglets et, comme la maquette, sur les sous-pages (`/saison` met « Semaine » en valeur ; `/zones`, `/profil`, `/progres`, `/records` sans onglet en valeur), jamais sur les écrans plein écran (`/tests`, `/abonnement`) — règle `barreVisible` ; espaces coach et admin dans `src/app/(espace)`.
- Classes globales restantes : `.titre` (capitales), `.titre-carte` (titre de carte dans la police du texte), `.logo` (« le club »), `.lien`, `.message-info`, `.message-erreur`.
- Polices : déclarées **uniquement** dans `src/app/polices.ts` (next/font), exposées en `--police-titre` et `--police-texte`. Style des titres via `--titre-graisse`, `--titre-largeur`, `--titre-casse` dans `globals.css`. Ne jamais nommer une police ailleurs (vérifié par `tests/polices.test.ts`).
