# Vérifications à la main avant l'ouverture

Liste du 24/11/2026. Stripe reste en **mode test** et l'adresse reste `le-club-by-lcs.vercel.app` (le passage aux paiements réels et le nom de domaine font l'objet d'une étape à part).

À prévoir : **deux téléphones** (un iPhone et un Android, ou un iPad) et **trois comptes** (un membre, un coach, l'admin). Carte de test Stripe : `4242 4242 4242 4242`, date future, n'importe quel code.

Pour cocher une case : remplacer `[ ]` par `[x]` (sur GitHub : bouton crayon « Edit this file »).

## 1. Comptes et contrats (tableaux de bord)
- [ ] **Vercel** : l'offre gratuite (« Hobby ») est réservée à un usage **non commercial** ; une app payante demande l'offre **Pro**.
- [ ] **Supabase** : vérifier l'offre. En offre gratuite, le projet se **met en pause après une semaine sans activité** et il n'y a pas de sauvegarde quotidienne.
- [ ] **Supabase › Database › Backups** : des sauvegardes existent, et quelqu'un sait en restaurer une.
- [ ] **Resend** : le domaine d'envoi `lcsperformance.fr` est **vérifié** (réglages DNS en place chez l'hébergeur du domaine).
- [ ] Accès à Vercel, Supabase, Stripe, Resend et GitHub protégés par la **double authentification** ; au moins deux personnes peuvent s'y connecter.

## 2. Arrivée d'un nouveau membre (paiement en mode test)
- [ ] Depuis `/abonnement`, payer la formule **mensuelle** avec la carte de test.
- [ ] L'e-mail de bienvenue arrive, n'est **pas dans les indésirables**, et le lien permet de choisir un mot de passe.
- [ ] À la première connexion, « Avant de commencer » s'affiche ; impossible de continuer sans cocher la case ; les 3 liens légaux s'ouvrent.
- [ ] Le prénom et le nom saisis chez Stripe apparaissent dans « Salut … » et dans le Profil.
- [ ] Même chose avec la formule **annuelle** sur un autre e-mail : le Profil affiche « 499 €/an ».
- [ ] « Mot de passe oublié » : l'e-mail arrive et le nouveau mot de passe fonctionne.
- [ ] Déconnexion, puis reconnexion.

## 3. Parcours du membre sur téléphone
- [ ] **Tests de départ** : 4 mesures + puissance max 5 min ; zones affichées sur Course, Vélo, Natation et Cardio.
- [ ] Personnaliser une zone, puis « Revenir aux valeurs du Club ».
- [ ] **Niveau et profil** choisis ; la suggestion de profil s'affiche.
- [ ] **Ma saison** : ajouter une course ; « J-xx » et la phase apparaissent sur l'accueil et dans Ma semaine.
- [ ] **Ma semaine** : séances du jour affichées ; les flèches ‹ › s'arrêtent à la semaine d'inscription et à la fin de la période payée.
- [ ] **Séance** : « Marquer comme faite », RPE et commentaire ; en revenant, le ressenti est conservé.
- [ ] **Ressources** : un contenu de semaine 1 s'ouvre, les suivants sont verrouillés ; favori, « Vu », commentaire sous une vidéo.
- [ ] **Calculateur** : affiché dans l'app, ou bouton « Ouvrir le calculateur ».
- [ ] **Avantages** : « Copier le code » copie bien le code.
- [ ] **Mes records** et **Mes progrès** s'affichent après un 2e test.
- [ ] Le **bandeau du prochain événement** apparaît en haut et mène à l'agenda.
- [ ] Imprimer une séance : le programme n'apparaît pas.

## 4. Club en direct (deux téléphones)
- [ ] Un message posté sur le téléphone A apparaît **sans recharger** sur le téléphone B ; badge de non-lus dans la liste des canaux.
- [ ] Un membre ne peut pas écrire dans « Annonces » ; le coach et l'admin le peuvent.
- [ ] Supprimer son message ; en admin, supprimer celui d'un autre (noté dans le journal).
- [ ] **Boîte à questions** : poser une question, la retirer ; en admin, la marquer traitée.
- [ ] **Agenda** : calendrier ; « Ajouter à mon agenda » ouvre l'agenda du téléphone.

## 5. App installée et notifications
- [ ] **iPhone** (Safari, iOS 16.4+) : Partager › « Sur l'écran d'accueil » ; icône du Club, plein écran, écran de démarrage sombre.
- [ ] **Android** (Chrome) : installer l'app ; mêmes vérifications.
- [ ] **iPad** : installer, tourner en portrait et en paysage.
- [ ] Mode avion : la page « Pas de connexion » s'affiche au lieu d'une erreur.
- [ ] Dans l'app installée : « Activer les notifications » ; la fenêtre d'autorisation ne s'ouvre **qu'au toucher du bouton**.
- [ ] Depuis un autre compte (admin ou coach), publier une **annonce** : la notification arrive chez le membre et ouvre le canal.
- [ ] Créer un **webinaire** : notification « Nouvel événement ». Créer une **FAQ** : aucune notification.
- [ ] Créer une FAQ pour le **lendemain** : le rappel arrive le soir ; dans Vercel › Cron Jobs, `/api/rappels-faq` réussit.
- [ ] Profil : couper « Annonces » puis publier une annonce : rien n'arrive. Essayer « Désactiver sur cet appareil ».

## 6. Abonnement (mode test)
- [ ] Profil › « Gérer mon abonnement » ouvre le portail Stripe ; **résilier** : l'app affiche la date de fin et l'accès reste ouvert jusque-là.
- [ ] Changer de formule depuis le portail : le Profil se met à jour.
- [ ] Carte refusée (carte de test `4000 0000 0000 0341`) : le statut d'impayé s'affiche.
- [ ] Payer deux fois avec le même e-mail : le second paiement est **remboursé automatiquement**.
- [ ] Abonnement terminé : renvoi vers « Abonnement » ; ni Club, ni ressources, ni programme.

## 7. Espaces coach et admin
- [ ] **Coach** : liste des athlètes, recherche, fiche avec RPE et commentaires ; **aucun** bouton de modification, aucun e-mail visible.
- [ ] **Admin › Membres** : offrir un accès, couper un accès, renvoyer l'e-mail d'accès ; chaque action est dans le journal.
- [ ] **Admin › Équipe** : passer Martin en « Coach + admin » ; ses messages s'affichent avec « Coach ».
- [ ] **Admin › Ressources** : déposer un PDF et un lien YouTube non répertorié ; ils s'ouvrent côté membre à la bonne semaine.
- [ ] **Admin › Agenda, Questions, Partenaires** : créer, modifier, supprimer un élément de chaque.
- [ ] Un membre qui tape `/admin/...` ou `/coach` est renvoyé vers son accueil.

## 8. Données personnelles
- [ ] Profil › « Télécharger mes données » : le fichier contient les données du membre, pas le programme.
- [ ] Profil › « Supprimer mon compte » (compte de test abonné) : abonnement résilié dans Stripe, connexion impossible, membre absent de Admin › Membres.
- [ ] Les 3 pages légales s'ouvrent sans être connecté (navigation privée).

## 9. Contenus à remplacer
- [ ] **Programme réel** de Martin (fil rouge et blocs S, M, L, XL, par niveau et profil), puis **suppression des séances de démonstration**.
- [ ] **Ressources** : les 14 contenus « bientôt disponible ».
- [ ] **Vidéos** des tests de départ.
- [ ] **Agenda** : vraies dates de FAQ et d'événements ; supprimer les exemples de janvier.
- [ ] **Partenaires** : vrais codes à la place de Pyrène et Onatera.
- [ ] **Logo** : remplacer `marque/logo-provisoire.jpg`, lancer `npm run icones`, réinstaller l'app pour vérifier.
- [ ] **Polices** Tussilago et Helvetica Neue (fichiers et licences).
- [ ] **Pages légales** : remplir tous les **[à compléter]**, puis **relecture par un juriste** (dont la question de la FC au seuil).
- [ ] Martin valide les **seuils du profil suggéré** (85 % / 80 %), les **durées des blocs S et XL** et les pourcentages des zones.

## 10. Juste avant d'ouvrir
- [ ] **Supprimer tous les comptes et paiements de test** (app et Stripe mode test).
- [ ] Vérifications GitHub vertes sur la dernière version ; `npm run migrations -- etat` : tout « appliquée ».
- [ ] Essai complet, du paiement à la première séance, par une personne qui découvre l'app.
