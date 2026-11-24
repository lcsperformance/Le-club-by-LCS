import type { Metadata } from "next";
import { ACompleter, PageLegale } from "@/components/legal/PageLegale";

export const metadata: Metadata = { title: "Mentions légales · Le Club by LCS" };

export default function MentionsLegales() {
  return (
    <PageLegale titre="Mentions légales">
      <h2>Éditeur de l&apos;application</h2>
      <p>
        L&apos;application « Le Club by LCS » est éditée par <ACompleter>raison sociale et forme juridique</ACompleter>, au capital de{" "}
        <ACompleter>montant du capital</ACompleter>, dont le siège est situé <ACompleter>adresse du siège</ACompleter>.
      </p>
      <ul>
        <li>
          Immatriculation : <ACompleter>RCS ou RNE, numéro SIREN / SIRET</ACompleter>
        </li>
        <li>
          Numéro de TVA intracommunautaire : <ACompleter>numéro de TVA, ou « TVA non applicable »</ACompleter>
        </li>
        <li>
          Téléphone : <ACompleter>numéro de téléphone</ACompleter>
        </li>
        <li>E-mail : Leclub@lcsperformance.fr</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>
        <ACompleter>nom et qualité du directeur de la publication</ACompleter>
      </p>

      <h2>Hébergement</h2>
      <p>L&apos;application est hébergée par :</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong> (site et serveurs de l&apos;application) : <ACompleter>adresse et téléphone de Vercel</ACompleter>
        </li>
        <li>
          <strong>Supabase</strong> (base de données, comptes et fichiers ; serveurs situés dans l&apos;Union européenne, en Irlande) :{" "}
          <ACompleter>raison sociale, adresse et téléphone de Supabase</ACompleter>
        </li>
      </ul>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les programmes d&apos;entraînement, textes, vidéos, documents, logos et éléments graphiques de l&apos;application sont la propriété de{" "}
        <ACompleter>titulaire des droits</ACompleter> ou de leurs auteurs. Toute reproduction, diffusion ou extraction, totale ou partielle, sans
        autorisation écrite, est interdite. Le programme d&apos;entraînement est réservé à l&apos;usage personnel du membre et n&apos;est pas
        téléchargeable.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement de vos données est décrit dans la <a className="lien" href="/confidentialite">politique de confidentialité</a>.
      </p>
    </PageLegale>
  );
}
