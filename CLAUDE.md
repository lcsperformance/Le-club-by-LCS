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
- Niveau et profil : choisis par le membre (jamais de valeur par défaut), enregistrés dès qu'il touche une option (`ChoixNiveauProfil`, action `enregistrerChoix`), sous « Mes zones » et sur `/profil`. Le Profil mène aussi à Mes records (`/records`) et Mes progrès (`/progres`). Textes dans `config/profils.json` (validé par `npm run verifier-config`, logique dans `src/lib/config-profils.ts`).
- Ma saison (`/saison`) : objectifs du membre dans la table `objectifs` (bloc S, M, L, XL, `date_objectif` et `nom` facultatif, 60 caractères au plus : `lireNomCourse`, titre affiché `titreObjectif` = le nom, sinon « Triathlon M »). Durées des blocs dans `config/blocs.json` (validé par `npm run verifier-config`, logique dans `src/lib/config-blocs.ts`) ; S et XL sont provisoires. Règles testables dans `src/lib/saison.ts` (début du bloc = course − durée, statut, démarrage en cours de route, chevauchement : la course la plus proche mène, décompte « J-xx » / « Jour J », phase « Fil rouge » ou « Bloc M, semaine 3/12 »), lecture `lireObjectifs` dans `src/lib/saison-serveur.ts`, actions dans `src/app/(membre)/saison/actions.ts`. Le décompte (`CarteDecompte`) est aussi en haut de Ma semaine ; l'accueil affiche la phase (`phaseCourte`) et la carte « Bloc en cours » / « Fil rouge » (`carteAccueil`). Ma semaine : jours et titre dans `src/lib/semaine.ts`, bande des 7 jours `BandeJours`. Navigation entre semaines (`/semaine?du=AAAA-MM-JJ`, flèches ‹ ›) : de la semaine d'inscription (`Utilisateur.dateInscription`) à la semaine du dernier jour payé ou offert (`dernierJourPaye` ; l'équipe du Club voit 4 semaines à l'avance), règles `bornesSemaines`, `semaineDemandee`, `semainesVoisines` ; la phase et le programme sont ceux de la semaine affichée (son lundi), le décompte reste celui d'aujourd'hui. Calendrier réutilisable : `CalendrierMois` (`@/components/ui`).
- Programme (tables `seances` : sport natation/velo/course/renfo, titre, `duree_minutes` ; `blocs_seance` : ordre, libellé, détail, zone 1-5 ou vide ; `programme` : phase `fil_rouge`/S/M/L/XL, semaine, jour 1-7 = lundi-dimanche, ordre, niveau, profil, séance). Lisible par tout membre connecté, écrit seulement par le serveur. Règles testables dans `src/lib/programme.ts` (`semaineDuProgramme` : semaine du bloc en cours, sinon fil rouge en boucle depuis `DEPART_FIL_ROUGE` ; `formatDuree` ; `cibleDuBloc` : allure/FC d'une zone ou cadenas), lecture dans `src/lib/programme-serveur.ts`. Écrans : séances du jour dans Ma semaine (`BandeJours`), page `/seance/[id]` (`EcranSeance`). Séances de démonstration (semaine 1 du fil rouge, une séance au moins chaque jour pour chaque niveau, identifiants `de000000-…`) dans `supabase/migrations/20261125100000_programme_demo.sql` et `20261128000000_programme_demo_tous_les_jours.sql`. Le programme n'est jamais téléchargeable : pas d'export, et tout conteneur `data-programme` est masqué à l'impression.
- Ressenti de séance (données de santé) : table `ressentis` (une ligne = séance faite ce jour-là, `seance_id` mis à vide si la séance est retirée ; `rpe` 1-10, `douleur`, `commentaire` 500 caractères au plus). Le membre lit, ajoute, supprime les siens et ne modifie que `rpe`, `douleur`, `commentaire` ; coach et admin lisent seulement ; prouvé dans `tests/securite-ressenti.test.ts` et `tests/securite-tests-zones.test.ts`. Règles dans `src/lib/ressenti.ts` (séance du jour ou des 14 jours passés, jamais à venir ; au-delà, le ressenti reste affiché en lecture seule), actions `marquerSeance` et `enregistrerRessenti` (`src/app/(membre)/seance/actions.ts`), composant `SuiviSeance` ; la page Séance reçoit le jour par `?jour=AAAA-MM-JJ` (lien depuis Ma semaine, qui coche les séances faites).
- Mes progrès (`/progres?sport=course|velo|natation|cardio`, retour vers Mes zones, bouton « Voir mon évolution » sous Mes zones) : courbe SVG lumineuse, gain depuis le premier test et historique, à partir de `historiqueSport`. Règles testables dans `src/lib/progres.ts` (`courbe` : plus haut = meilleur, étiquettes du premier et du dernier point seulement au-delà de 4 tests ; `gainDepuisPremier` ; `lignesHistorique`).
- Mes records (`/records`) : table `records` (une ligne par membre et par épreuve `10km`, `semi`, `marathon`, `tri_s`, `tri_m`, `tri_l`, `tri_xl`, `duree_secondes`) ; pas de ligne = pas de record. Le membre lit et modifie les siens, coach et admin les lisent. Saisie « 41:32 » ou « 1:32:10 », durées plausibles par épreuve, règles dans `src/lib/records.ts` (`lireTemps`, `lireRecords`, `formatTemps`), action `enregistrerRecords` (champ vide = record effacé).
- Ressources (`/ressources`, `/ressources/[theme]`, `/ressources/favoris`, `/ressources/contenu/[id]`) : thèmes et sous-rubriques dans les tables `themes_ressources` (clé, nom, icône parmi nutrition, natation, velo, course, preparation — SVG `IconeTheme` —, ordre) et `sous_rubriques` (thème, clé, nom, ordre), lus par `lireThemes()`. Table `ressources` (thème et sous-rubrique existants, titre, type `pdf`/`video`, `semaine_deblocage`, `ordre`, `youtube_id` pour une vidéo YouTube non répertoriée, `fichier` = chemin du PDF dans le stockage privé « ressources », `miniature` = chemin dans le stockage public « miniatures », sinon celle de YouTube) : les membres lisent le catalogue mais jamais `youtube_id`, `fichier` ni `miniature` ; ils sont donnés par `ressources_medias()` et `fichier_ressource()` seulement si `ressource_debloquee()` (semaine d'ancienneté `semaine_anciennete()` ≥ semaine de déblocage ; l'équipe du Club voit tout). Téléchargement : route `/ressources/contenu/[id]/telecharger` (lien temporaire 60 s, note « Téléchargé »). `suivi_ressources` (favori, `consulte_le` = vue ou téléchargé), privé à chaque membre. `commentaires_ressources` sous les vidéos : lisibles par les membres qui ont débloqué la vidéo, prénom et rôle de l'auteur recopiés par la base, suppression par l'auteur ou l'admin, pas de votes. Règles testables dans `src/lib/ressources.ts`, lecture dans `src/lib/ressources-serveur.ts`, actions dans `src/app/(membre)/ressources/actions.ts`. Démo sans vidéo ni fichier (« Vidéo / Fichier bientôt disponible ») : `supabase/migrations/20261129100000_ressources_demo.sql`. Preuves : `tests/securite-ressources.test.ts` (déblocage selon l'ancienneté, fichier verrouillé inaccessible même par son adresse ; la base de test `tests/supabase-shim.sql` reproduit le stockage `storage.objects` et `storage.buckets`) et `tests/telecharger-route.test.ts`.
- Admin des Ressources (`/admin/ressources`, `/nouveau`, `/[id]`, `/themes`, `/commentaires`, réservé au rôle admin) : contenus par thème avec ce qu'il manque (`resumeContenu`), formulaire d'un contenu (`FormulaireContenu` : le navigateur de l'admin dépose le PDF ou la miniature dans le stockage, puis l'action `enregistrerContenu` enregistre et efface les fichiers remplacés), thèmes et sous-rubriques (`GestionThemes` ; clé tirée du nom par `cleDepuisNom` ; suppression refusée par la base tant qu'il reste un contenu), modération (`admin_supprimer_commentaire`, notée `commentaire_supprime` dans `journal_admin`). Seul l'admin écrit (sécurité par ligne sur les tables et le stockage ; fiche complète lue par `admin_ressources()`). Règles testables dans `src/lib/admin/ressources.ts` (`lireLienYoutube` : youtu.be, watch?v=, shorts, embed, live ; `lireContenu`, `lireTheme`, `lireSousRubrique` ; `erreurFichier` : PDF 50 Mo, miniature JPG/PNG/WebP 2 Mo), lecture dans `src/lib/admin/ressources-serveur.ts`, actions dans `src/app/(espace)/admin/ressources/actions.ts`. Preuve : `tests/securite-admin-ressources.test.ts`.
- Club (`/club`, `/club/[canal]`, ouvert aux rôles membre, coach et admin) : canaux collectifs dans la table `canaux` (annonces en `lecture_seule`, général, présentations, bloc-m, bloc-l, nutrition-matos, courses), créés uniquement par migration : aucun compte ne peut créer de canal, donc **aucun message privé**. `messages_club` (texte 1 000 caractères au plus, prénom et rôle de l'auteur recopiés par la base, pas de modification) : lisibles par tout membre connecté ; chacun écrit en son nom, « annonces » réservé à l'admin et au coach ; chacun supprime ses messages, l'admin n'importe lequel par `admin_supprimer_message()` (noté `message_supprime` dans `journal_admin`). Non-lus : `canaux_non_lus()` (messages des autres depuis `lectures_canaux.lu_jusqua`, sinon depuis l'inscription), `marquer_canal_lu()` à l'ouverture et pendant la lecture. Temps réel : `messages_club` dans la publication `supabase_realtime` ; `FilMessages` (fil d'un canal, insertions et suppressions en direct) et `ActualiserEnDirect` (badges de la liste). Règles testables dans `src/lib/club.ts`, lecture dans `src/lib/club-serveur.ts`, actions dans `src/app/(membre)/club/actions.ts`. Preuve : `tests/securite-club.test.ts`. Onglets du Club (`OngletsClub`) : Discussion, Questions, Agenda.
- Boîte à questions (`/club/questions`) : table `questions_faq` (texte 300 caractères au plus, prénom et rôle recopiés par la base, `traitee_le`), **sans votes** (aucune colonne ni table prévue). Tout membre connecté lit toutes les questions (« Posée par Thomas le 18/11/2026 ») et pose les siennes ; chacun retire les siennes ; seul l'admin les marque traitées (`/admin/questions` : à traiter / traitées, copier la liste pour la FAQ) ou supprime celles des autres. Carte « Prochaine FAQ en visio » (`prochaineFaq`). Règles dans `src/lib/questions.ts`.
- Agenda (`/club/agenda`, admin : `/admin/agenda`, `/nouveau`, `/[id]`) : table `evenements` (titre, type `faq`/`webinaire`/`stage`/`autre`, `debut`, `fin`, lieu, lien `https://`, description, `dates_a_confirmer` + `periode`), lue par tous, écrite par l'admin seul. Heures stockées en UTC, saisies et affichées à l'heure de Paris (`depuisHeureDeParis`, `enHeureDeParis`, changements d'heure compris), « Jeudi 14 janvier · 19 h 30 – 20 h 30 » (`quandEvenement`). Calendrier mensuel `CalendrierMois` (props `marques`, `moisInitial`, `onChangerMois`), toucher un jour filtre ses événements. « Ajouter à mon agenda » : fichier `.ics` (route `/club/agenda/[id]/ics`, `fichierIcs`). Règles dans `src/lib/agenda.ts`, lecture `lireQuestions`/`lireEvenements` dans `src/lib/club-serveur.ts`. Preuve : `tests/securite-questions-agenda.test.ts`.
- Abonnement Stripe (mode test) : webhook `src/app/api/stripe/webhook/route.ts`, règles testables dans `src/lib/abonnement/` (`etat.ts`, `webhook.ts` avec dépendances injectées, `dependances.ts` pour les vrais services). Accès membre jusqu'à `membres.abonnement_fin` (`aAcces`), sinon `exigerRole` renvoie vers `/abonnement`. Seul le serveur (clé secrète Supabase, `src/lib/supabase/admin.ts`) écrit l'abonnement ; jamais de clé secrète côté navigateur. Chaque cas de bord a son test dans `tests/abonnement.test.ts`. Deux formules (49 €/mois, 499 €/an) : prix dans `src/lib/abonnement/formules.ts`, choix sur `/abonnement` (`ChoixFormule`), formule en cours dans `membres.formule` (écrite par le webhook), changement de formule via le portail Stripe.
- Prénom et nom : colonnes `membres.prenom` et `membres.nom` (modifiables par le membre, champ `ChampPrenom` avec `champ="prenom"|"nom"` dans le Profil), remplies au paiement à partir du nom Stripe si elles sont vides (`prenomDepuisNom` : premier mot ; `nomDepuisNomComplet` : la suite ; `src/lib/prenom.ts`). Accueil : `EnTeteAccueil` (« Salut Caroline », ou « Salut ! »).
- Espace admin « Membres » (`/admin/membres`, réservé à l'admin) : liste, recherche (prénom, e-mail), statut, niveau, ancienneté (`src/lib/admin/membres.ts`). Accès manuel : `membres.acces_offert_jusqua` (accès offert jusqu'à une date) et `membres.acces_coupe` (bloque même un abonnement payé), jamais touchés par le webhook ; pris en compte par `aAcces`. Écriture uniquement par les fonctions `admin_offrir_acces`, `admin_couper_acces`, `admin_noter_email_acces` (vérifient le rôle admin), tracées dans `journal_admin`. Couper l'accès programme aussi la résiliation Stripe en fin de période. Toute page sous `/admin` doit appeler `exigerRole("admin")` (vérifié par `tests/admin-membres.test.ts`).
- Espace coach (`/coach`, `/coach/athletes/[id]`, rôles coach et admin) : le coach **ne lit plus la fiche entière des membres** (seul l'admin la lit) ; la liste vient de `coach_athletes()` (prénom, nom, niveau, profil, date d'inscription, accès en cours ; jamais d'e-mail ni d'abonnement). Liste avec recherche par prénom ou nom, accès en cours par défaut, case « Voir aussi les anciens membres » (`filtrerAthletes`). Fiche en lecture seule : niveau, profil, objectifs à venir (`objectifsAVenir`), tableau des séances depuis `ressentis` (date « Dim. 10 janv. », sport, séance, RPE coloré, douleur, commentaire ; filtre « Toutes » / « Douleurs ») ; tableau si la fiche est assez large (requête de conteneur), cartes sinon. Aucune écriture possible et aucun message privé (seul lien : le Club). Règles dans `src/lib/coach.ts`, lecture dans `src/lib/coach-serveur.ts`. Preuve : `tests/securite-coach.test.ts`.
- Rôles `membre`, `coach`, `admin` (colonne `membres.role`). Une page protégée appelle `exigerRole(...)` de `src/lib/auth.ts` dans un composant placé sous `<Suspense>` (Cache Components activé).
- Pas d'inscription libre : jamais de `signUp` dans l'app.
- Écrans : séparer l'affichage (composant qui reçoit les données) de la lecture en base (page), pour pouvoir l'afficher dans les aperçus.
- Composants Neon dans `src/components/ui` (import depuis `@/components/ui`) : `Carte`, `BoutonPrincipal`, `BoutonSecondaire`, `Champ`, `Compteur` (− valeur +), `PastilleZone`, `CalendrierMois`. Les utiliser plutôt que de recopier des styles ; vitrine sur `/admin/composants`.
- Fond : `FondNeon`. Espace membre dans `src/app/(membre)` avec la `BarreOnglets` (onglets définis dans `src/lib/onglets.ts`) : affichée sur les 5 pages d'onglets et, comme la maquette, sur les sous-pages (`/saison` et `/seance` mettent « Semaine » en valeur ; `/zones`, `/profil`, `/progres`, `/records` sans onglet en valeur), jamais sur les écrans plein écran (`/tests`, `/abonnement`) — règle `barreVisible` ; espaces coach et admin dans `src/app/(espace)`.
- Classes globales restantes : `.titre` (capitales), `.titre-carte` (titre de carte dans la police du texte), `.logo` (« le club »), `.lien`, `.message-info`, `.message-erreur`.
- Polices : déclarées **uniquement** dans `src/app/polices.ts` (next/font), exposées en `--police-titre` et `--police-texte`. Style des titres via `--titre-graisse`, `--titre-largeur`, `--titre-casse` dans `globals.css`. Ne jamais nommer une police ailleurs (vérifié par `tests/polices.test.ts`).
