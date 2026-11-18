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

- Titres : **Tussilago Bold**
- Texte : **Helvetica Neue LT Pro**

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
