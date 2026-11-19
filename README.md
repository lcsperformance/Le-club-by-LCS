# Le Club by LCS

Application d'abonnement pour les triathlètes du coach Martin. Les règles du projet sont dans [CLAUDE.md](CLAUDE.md).

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis coller l'URL et la clé publique du projet Supabase
npm run dev                  # http://localhost:3000
```

## Base de données (Supabase)

Projet Supabase : « Le Club by LCS » (réf. `twgbgqsfpseqsnuivlab`, région eu-west-1).

Les tables et la sécurité par ligne sont décrites dans `supabase/migrations/` (un fichier par changement).
Les migrations appliquées sont enregistrées dans la base, table `supabase_migrations.schema_migrations`
(la même que la CLI Supabase) :

```bash
export SUPABASE_PROJECT_REF=twgbgqsfpseqsnuivlab SUPABASE_ACCESS_TOKEN=<jeton personnel Supabase>
npm run migrations -- etat        # appliquées / en attente
npm run migrations -- appliquer   # applique celles en attente (chacune en une transaction)
```

Réglages d'authentification appliqués sur le projet :
- inscription libre **désactivée** (les comptes sont créés par le paiement ou par un admin) ;
- adresse du site : `https://le-club-by-lcs.vercel.app` ; adresses de retour autorisées : localhost, production et aperçus Vercel ;
- mot de passe : 8 caractères minimum.

## E-mails (Resend)

**Branché le 19/11/2026** : domaine `lcsperformance.fr` vérifié chez Resend (DNS chez Hostinger :
`resend._domainkey`, `rsend`, `send`, `_dmarc`), envoi depuis `Leclub@lcsperformance.fr`,
e-mails en français installés, limite 60 e-mails par heure.

Pour modifier un e-mail : éditer `supabase/emails/`, puis relancer `npm run emails`.

Marche suivie (pour mémoire ou pour un autre projet) :

1. **Resend** (resend.com) : créer le compte, ajouter le domaine d'envoi (ex. `lcs-performance.fr`)
   et ajouter chez l'hébergeur du domaine les enregistrements DNS indiqués, jusqu'à « Verified ».
2. **Resend** : créer une clé API (« Sending access », limitée à ce domaine).
3. **Supabase** > Authentication > Emails > **SMTP Settings** : activer « Custom SMTP » et saisir :
   - Host `smtp.resend.com`, Port `465`, Username `resend`, Password = la clé API Resend ;
   - Sender email, par ex. `club@lcs-performance.fr`, Sender name `Le Club by LCS`.
4. Installer les e-mails en français (`supabase/emails/`) et relever la limite d'envoi :
   `SUPABASE_PROJECT_REF=… SUPABASE_ACCESS_TOKEN=… npm run emails`

Les e-mails pointent alors directement vers `/auth/confirm` (lien utilisable sur n'importe quel appareil).

## Modifier les pourcentages des zones (pour Martin)

Les pourcentages des zones d'entraînement sont dans le fichier [`config/zones.json`](config/zones.json).
On peut les changer sans toucher au code :

1. Sur GitHub, ouvrir `config/zones.json`, puis cliquer sur le **crayon** (« Edit this file »).
2. Changer les nombres voulus. Chaque ligne contient **6 nombres qui montent** : les bornes de Z1 à Z5
   (Z1 va du 1er au 2e nombre, Z2 du 2e au 3e…).
   - `course` et `natation` : % de la vitesse au seuil ;
   - `velo` : % de la FTP ;
   - `frequence_cardiaque` : % de la FC au seuil (affichée pour la course et le vélo) ;
   - `noms` : les noms des 5 zones.
3. Cliquer sur **Commit changes**. Le site est mis à jour en une minute environ.

Si le fichier est mal rempli (virgule en trop ou oubliée, nombres qui ne montent pas, nombre manquant),
la mise à jour est refusée et le site en ligne reste comme avant. Pour voir le message qui explique
quoi corriger (avec le numéro de ligne) : sur GitHub, onglet **Actions**, ou sur Vercel, journal du
déploiement en échec. En local : `npm run verifier-config`.

## Modifier les textes des niveaux et des profils

Les textes proposés au membre (écrans « Mes zones » et « Profil ») sont dans
[`config/profils.json`](config/profils.json) : même méthode que pour les zones (crayon sur GitHub,
puis **Commit changes**). Ne changer que les textes entre guillemets après `libelle` et
`description`, jamais les clés (`finisher`, `challenger`, `performer`, `extensif`, `intensif`).
Un fichier mal rempli bloque la mise à jour avec un message clair, le site reste comme avant.

## Rôles

| Rôle | Peut faire |
|------|-----------|
| membre | voir et modifier ses propres données (niveau, profil, tests, zones, objectifs) |
| coach | lire les données de tous les athlètes, sans rien modifier |
| admin | tout lire ; changer le rôle ou le statut d'abonnement via `admin_changer_role` et `admin_changer_statut` |

Les tables et la sécurité par ligne sont décrites dans `supabase/migrations/`.
Pour les appliquer : Supabase > **SQL Editor** > coller le contenu du fichier > **Run**
(ou `supabase db push` avec la CLI Supabase).

## Tests

```bash
npm test          # tests (une base PostgreSQL locale est nécessaire pour les tests de sécurité)
npm run typecheck # vérification des types
npm run lint
```

Les tests de sécurité utilisent `TEST_DATABASE_URL`
(par défaut `postgres://postgres:postgres@localhost:5432/postgres`).

## Déploiement Vercel

Projet Vercel `le-club-by-lcs` déjà relié au dépôt et configuré (variables Supabase en place). La branche `main` part en production, les autres branches en aperçu.

Pour un nouveau projet :

1. Vercel > **Add New Project** > importer ce dépôt GitHub (framework détecté : Next.js).
2. Dans **Environment Variables**, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. **Deploy**. Les serveurs sont placés à Paris (`cdg1`, voir `vercel.json`).
