import type { Metadata } from "next";
import Link from "next/link";
import { EcranAuth } from "@/components/EcranAuth";
import { Carte } from "@/components/ui";

export const metadata: Metadata = { title: "Bienvenue · Le Club by LCS" };

/** Page de retour après le paiement Stripe. */
export default function PageBienvenue() {
  return (
    <EcranAuth titre="Bienvenue au Club !">
      <Carte style={{ display: "grid", gap: 10 }}>
        <p className="message-info">Ton paiement est validé, merci !</p>
        <p className="message-info">
          Tu vas recevoir dans quelques minutes un e-mail de <strong>Leclub@lcsperformance.fr</strong> pour choisir ton mot de
          passe. Pense à regarder dans tes indésirables.
        </p>
      </Carte>
      <p style={{ textAlign: "center", fontSize: 14 }}>
        Déjà membre ?{" "}
        <Link href="/connexion" className="lien">
          Me connecter
        </Link>
      </p>
    </EcranAuth>
  );
}
