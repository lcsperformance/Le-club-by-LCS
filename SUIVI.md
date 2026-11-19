# Où on en est — point du 19/11/2026 au soir

Tout ce qui suit est **en ligne** sur https://le-club-by-lcs.vercel.app (Stripe en **mode test**).
Les vérifications GitHub sont vertes sur `main`.

## Fait aujourd'hui (pull requests n°17 à n°22)

- **Prénom** du membre et en-tête « Salut Caroline » à l'accueil (n°17).
- **Paiement Stripe terminé et vérifié en ligne** (n°18, n°20, n°21) :
  - un paiement réussi crée le compte et envoie l'e-mail de bienvenue, qui affiche maintenant l'identifiant ;
  - la résiliation coupe l'accès à la fin de la période payée ;
  - le portail client Stripe est accessible depuis le Profil ;
  - plus de double prélèvement : si la même adresse paie deux fois, le second paiement est annulé, remboursé et un e-mail prévient la personne ;
  - plus de mois offert en cas d'impayé.
- **Formule annuelle 499 €/an** au choix, et changement de formule mois ↔ année dans le portail (n°19).
- **Tests de bout en bout du paiement** : `npm run test:paiement`, 10 tests sur 10 réussis en ligne.
- **Espace admin « Membres »** (n°22) :
  - liste des membres et recherche ;
  - ouvrir ou couper un accès ;
  - renvoyer l'e-mail d'accès ;
  - journal des actions.

## À tester demain matin (à la main, ~20 min)

Se connecter avec le compte **admin**, sauf mention contraire.

### Espace admin « Membres »
- [ ] Accueil admin → carte **« Membres »** : la liste s'affiche, avec le membre de test.
- [ ] La **recherche** fonctionne, par prénom ou par morceau d'e-mail.
- [ ] Ouvrir **« Gérer l'accès »** sur le membre de test :
  - [ ] **Ouvrir l'accès** jusqu'à une date : la pastille passe à « Accès offert jusqu'au … » si cette date est après la fin de l'abonnement.
  - [ ] **Retirer l'accès offert**.
  - [ ] **Renvoyer l'e-mail d'accès** : l'e-mail arrive (« choisir un nouveau mot de passe », puisque le compte s'est déjà connecté).
  - [ ] **Couper l'accès** :
    - la pastille devient « Accès coupé par l'admin » ;
    - connecté avec le membre de test, on arrive sur « Ton accès au Club a été suspendu » ;
    - dans Stripe (mode test), l'abonnement est marqué « s'annule le … ».
  - [ ] **Rétablir l'accès**. Avec le membre de test : Profil → « Gérer mon abonnement » → annuler la résiliation.
  - [ ] Le **journal** sous la fiche liste bien chaque action.
- [ ] Connecté avec le compte **coach**, ouvrir `/admin/membres` : on doit être renvoyé vers l'espace coach.

### Paiement
- [ ] Ouvrir la page de paiement Stripe et vérifier que le retour arrive sur `/bienvenue`.
  - Il faut un compte sans abonnement en cours pour voir le choix 49 €/mois ou 499 €/an.
  - Carte de test : `4242 4242 4242 4242`, n'importe quelle date future et n'importe quel code.
- [ ] Profil → « Gérer mon abonnement » → **passer à l'année** : la carte « Mon abonnement » affiche 499 €/an.
- [ ] **Resend → Emails** : vérifier qu'on voit l'e-mail « Le Club by LCS : ton second paiement est remboursé » (envoyé pendant les tests automatiques, à une adresse de test `@resend.dev`).
- [ ] Corriger le prénom du membre de test dans le Profil : il vaut « Lelait » parce que le nom a été saisi nom de famille en premier au paiement.

## Points encore fragiles

- L'arrivée réelle des e-mails « Bon retour » et « doublon remboursé » n'a pas pu être vérifiée par Claude (pas d'accès à Resend).
- Le webhook reçoit les messages Stripe dans un format plus ancien (2022) que celui du code (2025). Ça marche, mais il faudrait aligner la version du webhook.
- Le retour de l'année vers le mois (prévu à la fin de l'année payée) n'a pas été testé en ligne.

## Suite proposée (chaque étape : plan court, accord, puis code)

1. **Mes progrès** : courbes des tests de départ, et bouton « Voir mon évolution » sous Mes zones.
2. **Ma saison** (objectifs) et **Calculateur LCS**.
3. Accueil fidèle à la maquette :
   - liens « Voir la vidéo » ;
   - phase « Bloc M » ;
   - pastille « Challenger · Extensif ».
4. **Espace coach** : historique des athlètes en lecture seule.
5. **Canaux collectifs** et **boîte à questions** (sans votes).
6. **RPE et douleur** : ce sont des données de santé, avec un accès restreint.
7. **Ressources** débloquées selon l'ancienneté.
8. **Application installable** sur téléphone (PWA).
9. Avant le 1er janvier 2027 : recréer les objets Stripe en **mode réel**.

_Ce fichier sert seulement de pense-bête ; la pull request qui l'ajoute peut être fermée sans être fusionnée._
