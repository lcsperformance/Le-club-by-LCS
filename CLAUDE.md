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

- Vérifications automatiques GitHub (`.github/workflows/verifications.yml`) à chaque pull request : zones, lint, types, tests (avec PostgreSQL), compilation, affichage mobile. Ne pas fusionner si une croix rouge apparaît.

## Repères techniques

- Next.js 16 : lire `AGENTS.md` et la doc dans `node_modules/next/dist/docs/` avant d'écrire du code (ex. `middleware` s'appelle désormais `proxy`, fichier `src/proxy.ts`).
- Connexions Supabase : `src/lib/supabase/client.ts` (navigateur) et `server.ts` (serveur).
- Toute modification de la base passe par un nouveau fichier dans `supabase/migrations/`, avec la sécurité par ligne activée et testée dans `tests/rls.test.ts`.
- Dates : utiliser `src/lib/dates.ts` (fuseau Europe/Paris), dont `dateDuJourParis()` pour les colonnes `date`.
- Tests de départ : mesures, pas et limites dans `src/lib/tests-depart.ts` ; écran `/tests` ; un test par membre et par jour (upsert).
- Zones : pourcentages dans `config/zones.json` (modifiable par Martin, validé avant chaque compilation par `npm run verifier-zones`, logique dans `src/lib/config-zones.ts`), calculs dans `src/lib/zones.ts`, écran `/zones?sport=course|velo|natation`. Ne jamais écrire ces pourcentages en dur dans le code.
- Rôles `membre`, `coach`, `admin` (colonne `membres.role`). Une page protégée appelle `exigerRole(...)` de `src/lib/auth.ts` dans un composant placé sous `<Suspense>` (Cache Components activé).
- Pas d'inscription libre : jamais de `signUp` dans l'app.
- Écrans : séparer l'affichage (composant qui reçoit les données) de la lecture en base (page), pour pouvoir l'afficher dans les aperçus.
- Composants Neon dans `src/components/ui` (import depuis `@/components/ui`) : `Carte`, `BoutonPrincipal`, `BoutonSecondaire`, `Champ`, `Compteur` (− valeur +), `PastilleZone`. Les utiliser plutôt que de recopier des styles ; vitrine sur `/admin/composants`.
- Fond : `FondNeon`. Espace membre dans `src/app/(membre)` avec la `BarreOnglets` (affichée seulement sur les 5 pages d'onglets) (onglets définis dans `src/lib/onglets.ts`) ; espaces coach et admin dans `src/app/(espace)`.
- Classes globales restantes : `.titre` (capitales), `.titre-carte` (titre de carte dans la police du texte), `.logo` (« le club »), `.lien`, `.message-info`, `.message-erreur`.
- Polices : déclarées **uniquement** dans `src/app/polices.ts` (next/font), exposées en `--police-titre` et `--police-texte`. Style des titres via `--titre-graisse`, `--titre-largeur`, `--titre-casse` dans `globals.css`. Ne jamais nommer une police ailleurs (vérifié par `tests/polices.test.ts`).
