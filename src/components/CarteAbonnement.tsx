import { ouvrirPortail } from "@/app/(membre)/abonnement/actions";
import { BoutonSecondaire, Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { descriptionAbonnement } from "@/lib/abonnement/textes";

/** Carte « Mon abonnement » (maquette) : formule, état et accès au portail Stripe. */
export function CarteAbonnement({ abonnement, maintenant }: { abonnement: Utilisateur["abonnement"]; maintenant: Date }) {
  return (
    <Carte as="section" style={{ display: "grid", gap: 8 }} aria-labelledby="titre-abonnement">
      <h2
        id="titre-abonnement"
        className="titre-carte"
        style={{ fontSize: 12, color: "#a9a4c9", letterSpacing: "0.06em", textTransform: "uppercase" }}
      >
        Mon abonnement
      </h2>
      <p style={{ fontSize: 20, fontWeight: 800 }}>Le Club · 49 €/mois</p>
      <p style={{ fontSize: 14, color: "#a9a4c9", lineHeight: 1.4 }}>Sans engagement. Tu peux arrêter quand tu veux.</p>
      <p className="message-info" style={{ fontSize: 14 }}>
        {descriptionAbonnement(abonnement, maintenant)}
      </p>
      {abonnement.clientStripe && (
        <form action={ouvrirPortail} style={{ marginTop: 4 }}>
          <BoutonSecondaire type="submit">Gérer mon abonnement</BoutonSecondaire>
        </form>
      )}
    </Carte>
  );
}
