import type { Metadata } from "next";
import { ACompleter, PageLegale } from "@/components/legal/PageLegale";
import { prixFormule } from "@/lib/abonnement/formules";

export const metadata: Metadata = { title: "Conditions générales de vente · Le Club by LCS" };

export default function Cgv() {
  return (
    <PageLegale titre="Conditions générales de vente">
      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales de vente (CGV) encadrent l&apos;abonnement à « Le Club by LCS », application d&apos;entraînement au
        triathlon éditée par <ACompleter>raison sociale de l&apos;éditeur</ACompleter> (voir les <a className="lien" href="/mentions-legales">mentions légales</a>
        ). L&apos;abonnement donne accès, pendant sa durée, au programme d&apos;entraînement, aux ressources, aux canaux collectifs du Club, à la
        boîte à questions, à l&apos;agenda et aux avantages partenaires. Il ne comprend pas de suivi individuel ni d&apos;échange privé avec un
        coach.
      </p>

      <h2>2. Formules et prix</h2>
      <ul>
        <li>
          Abonnement mensuel : <strong>{prixFormule("mensuelle")}</strong>, sans engagement.
        </li>
        <li>
          Abonnement annuel : <strong>{prixFormule("annuelle")}</strong>, payé en une fois pour un an, sans engagement au-delà de l&apos;année
          payée.
        </li>
      </ul>
      <p>
        Les prix sont indiqués en euros, <ACompleter>TTC, ou « TVA non applicable, article 293 B du CGI »</ACompleter>. Le prix applicable est
        celui affiché au moment de la souscription ; en cas de changement de prix, le membre en est informé avant le renouvellement suivant{" "}
        <ACompleter>délai de prévenance</ACompleter>.
      </p>

      <h2>3. Souscription et paiement</h2>
      <p>
        L&apos;abonnement se souscrit en ligne. Le paiement se fait par carte bancaire, par l&apos;intermédiaire de notre prestataire de paiement
        Stripe : nous ne voyons ni ne conservons jamais les numéros de carte. Le montant est prélevé à la souscription, puis automatiquement à
        chaque échéance (chaque mois ou chaque année) tant que l&apos;abonnement n&apos;est pas résilié. Après le paiement, le membre reçoit un
        e-mail pour choisir son mot de passe et accéder à l&apos;application.
      </p>

      <h2>4. Durée et renouvellement</h2>
      <p>
        L&apos;abonnement est sans engagement. Il se renouvelle automatiquement à la fin de chaque période (un mois ou un an), jusqu&apos;à sa
        résiliation.
      </p>

      <h2>5. Résiliation</h2>
      <p>
        Le membre peut résilier à tout moment, sans frais, depuis l&apos;application : Profil, « Gérer mon abonnement », qui ouvre le portail client
        sécurisé de Stripe. La résiliation prend effet à la fin de la période déjà payée : l&apos;accès reste ouvert jusqu&apos;à cette date, et
        aucun prélèvement n&apos;a lieu ensuite. La période en cours n&apos;est pas remboursée, même partiellement. Le changement de formule
        (mensuelle ou annuelle) se fait aussi depuis ce portail.
      </p>
      <p>
        La suppression du compte depuis le Profil (« Supprimer mon compte ») met fin immédiatement à l&apos;abonnement et à l&apos;accès, sans
        remboursement de la période en cours.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        <ACompleter>
          conditions du droit de rétractation de 14 jours pour un contenu numérique fourni immédiatement (accord exprès du membre et renonciation
          éventuelle), et modèle de formulaire de rétractation
        </ACompleter>
      </p>

      <h2>7. Accès et usage</h2>
      <ul>
        <li>Le compte est personnel : il ne doit pas être partagé.</li>
        <li>
          Le programme d&apos;entraînement reste dans l&apos;application : il n&apos;est pas téléchargeable et ne doit pas être reproduit ni diffusé.
        </li>
        <li>Les ressources (vidéos, documents) se débloquent au fil de l&apos;ancienneté de l&apos;abonnement.</li>
        <li>
          Les messages publiés dans les canaux du Club et les questions sont visibles par les autres membres : ils doivent rester respectueux. Le
          Club peut retirer un message ou un commentaire, et suspendre l&apos;accès en cas d&apos;abus <ACompleter>conditions de suspension</ACompleter>
          .
        </li>
      </ul>

      <h2>8. Santé et responsabilité</h2>
      <p>
        Le membre choisit lui-même son niveau et son profil, et s&apos;entraîne sous sa propre responsabilité. Le Club ne remplace pas un avis
        médical : en cas de doute sur son aptitude à la pratique sportive, le membre consulte un médecin.{" "}
        <ACompleter>clauses de responsabilité et éventuelle exigence d&apos;un certificat médical</ACompleter>
      </p>

      <h2>9. Disponibilité</h2>
      <p>
        Nous faisons notre possible pour que l&apos;application soit accessible en permanence, sans pouvoir le garantir (maintenance, panne d&apos;un
        prestataire). <ACompleter>éventuel engagement en cas d&apos;interruption prolongée</ACompleter>
      </p>

      <h2>10. Données personnelles</h2>
      <p>
        Voir la <a className="lien" href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2>11. Réclamations et médiation</h2>
      <p>
        Pour toute réclamation : Leclub@lcsperformance.fr. En cas de litige non résolu, le membre peut recourir gratuitement au médiateur de la
        consommation : <ACompleter>nom, adresse et site du médiateur de la consommation</ACompleter>.
      </p>

      <h2>12. Droit applicable</h2>
      <p>
        Les présentes CGV sont soumises au droit français. <ACompleter>tribunal compétent</ACompleter>
      </p>
    </PageLegale>
  );
}
