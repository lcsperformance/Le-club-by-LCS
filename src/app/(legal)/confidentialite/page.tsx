import type { Metadata } from "next";
import { ACompleter, PageLegale } from "@/components/legal/PageLegale";
import styles from "@/components/legal/PageLegale.module.css";

export const metadata: Metadata = { title: "Politique de confidentialité · Le Club by LCS" };

const DONNEES = [
  ["Compte", "E-mail, prénom, nom, date d'inscription, rôle", "Créer et gérer votre compte, vous connecter"],
  ["Abonnement", "Formule, état et dates de l'abonnement, identifiants client et abonnement Stripe", "Exécuter l'abonnement, ouvrir ou fermer l'accès"],
  ["Entraînement", "Niveau, profil, tests de départ (allure seuil, FTP, puissance max sur 5 min, vitesse critique, FC au seuil), zones personnalisées, objectifs de saison, records", "Calculer vos zones et allures, vous proposer le programme adapté"],
  ["Ressenti de séance", "Séances faites, RPE (1 à 10), commentaire facultatif", "Suivre vos séances ; permettre à l'encadrement du Club de suivre votre entraînement"],
  ["Vie du Club", "Messages dans les canaux, questions pour la FAQ, commentaires sous les vidéos, messages lus", "Faire vivre les canaux collectifs et la FAQ en visio"],
  ["Ressources", "Favoris, contenus vus ou téléchargés", "Retrouver vos contenus"],
  ["Notifications", "Adresse d'envoi de chaque appareil autorisé, réglages (annonces, rappels FAQ, nouveaux événements)", "Vous envoyer les notifications que vous avez acceptées"],
  ["Acceptation", "Date et version des CGV et de la politique acceptées", "Prouver votre accord"],
] as const;

const PRESTATAIRES = [
  ["Vercel Inc.", "Hébergement de l'application (traitements serveur exécutés à Paris ; pages diffusées par son réseau mondial)"],
  ["Supabase", "Base de données, comptes et fichiers (serveurs en Irlande, Union européenne)"],
  ["Stripe", "Paiement et gestion de l'abonnement (numéros de carte gérés uniquement par Stripe)"],
  ["Resend", "Envoi des e-mails (bienvenue, choix du mot de passe, informations sur l'abonnement)"],
  ["Apple, Google ou Mozilla (selon votre appareil)", "Acheminement des notifications que vous avez acceptées"],
  ["YouTube (Google)", "Lecture des vidéos des Ressources, quand vous lancez une vidéo (mode sans cookie publicitaire)"],
] as const;

export default function Confidentialite() {
  return (
    <PageLegale titre="Politique de confidentialité">
      <h2>Responsable du traitement</h2>
      <p>
        <ACompleter>raison sociale, adresse du siège et représentant légal</ACompleter>. Contact : Leclub@lcsperformance.fr.{" "}
        <ACompleter>délégué à la protection des données, s&apos;il y en a un</ACompleter>
      </p>

      <h2>Données collectées et pourquoi</h2>
      <div className={styles.tableau}>
        <table>
          <thead>
            <tr>
              <th scope="col">Catégorie</th>
              <th scope="col">Données</th>
              <th scope="col">Pourquoi</th>
            </tr>
          </thead>
          <tbody>
            {DONNEES.map(([categorie, donnees, pourquoi]) => (
              <tr key={categorie}>
                <th scope="row">{categorie}</th>
                <td>{donnees}</td>
                <td>{pourquoi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Bases légales : l&apos;exécution du contrat d&apos;abonnement pour l&apos;essentiel ; votre consentement pour les notifications (que vous
        pouvez retirer à tout moment) ; nos obligations légales pour les données de facturation.{" "}
        <ACompleter>à faire valider</ACompleter>
      </p>

      <h2>Ressenti de séance : RPE et commentaires</h2>
      <p>
        Après une séance, vous pouvez noter votre effort (RPE, de 1 à 10) et ajouter un commentaire. Ces informations sont lues{" "}
        <strong>uniquement par vous et par l&apos;encadrement du Club</strong> (coachs et administrateurs), en lecture seule pour eux. Elles ne
        sont jamais montrées aux autres membres ; la base de données le garantit par une règle de sécurité appliquée à chaque ligne.
      </p>
      <p>
        Le commentaire n&apos;est pas destiné à recevoir des informations médicales. S&apos;il en contient, il n&apos;est lu que par vous et
        l&apos;encadrement du Club.
      </p>

      <h2>Qui voit quoi</h2>
      <ul>
        <li>Les autres membres voient seulement votre prénom (et votre rôle pour l&apos;équipe du Club) à côté de vos messages, questions et commentaires.</li>
        <li>
          L&apos;encadrement du Club (coachs et administrateurs) voit vos prénom, nom, niveau, profil, tests, zones, objectifs, records et ressentis
          de séance, en lecture seule. Seuls les administrateurs voient votre e-mail et votre abonnement.
        </li>
        <li>Personne d&apos;autre n&apos;a accès à vos données, et elles ne sont jamais vendues.</li>
      </ul>

      <h2>Prestataires</h2>
      <p>Vos données sont traitées pour notre compte par :</p>
      <ul>
        {PRESTATAIRES.map(([nom, role]) => (
          <li key={nom}>
            <strong>{nom}</strong> : {role}.
          </li>
        ))}
      </ul>
      <p>
        Certains de ces prestataires sont établis hors de l&apos;Union européenne (notamment aux États-Unis).{" "}
        <ACompleter>garanties encadrant ces transferts (clauses contractuelles types, Data Privacy Framework…)</ACompleter>
      </p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>
          Pendant votre abonnement, puis <ACompleter>durée de conservation après la fin de l&apos;abonnement</ACompleter>.
        </li>
        <li>Si vous supprimez votre compte, vos données sont effacées immédiatement de l&apos;application.</li>
        <li>
          Les factures et paiements sont conservés par Stripe pendant la durée exigée par la loi{" "}
          <ACompleter>durée légale de conservation des pièces comptables</ACompleter>.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>Vous pouvez à tout moment :</p>
      <ul>
        <li>accéder à vos données et les récupérer : Profil, « Télécharger mes données » (fichier lisible par un ordinateur) ;</li>
        <li>les corriger : Profil (prénom, nom, niveau, profil), écrans Tests, Zones, Ma saison et Mes records ;</li>
        <li>les effacer : Profil, « Supprimer mon compte » ;</li>
        <li>vous opposer à un traitement ou en demander la limitation, en écrivant à Leclub@lcsperformance.fr ;</li>
        <li>
          introduire une réclamation auprès de la CNIL (
          <a className="lien" href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
            cnil.fr
          </a>
          ).
        </li>
      </ul>

      <h2>Cookies et stockage sur l&apos;appareil</h2>
      <p>
        L&apos;application n&apos;utilise ni cookie publicitaire ni mesure d&apos;audience. Elle enregistre seulement ce qui est nécessaire à son
        fonctionnement : le cookie de session qui vous garde connecté, et sur votre appareil le fait que vous avez fermé les cartes « Installer
        l&apos;app » ou « Activer les notifications ». La page « Pas de connexion » est gardée sur l&apos;appareil pour s&apos;afficher sans
        réseau ; aucune donnée du Club n&apos;y est gardée.
      </p>
    </PageLegale>
  );
}
