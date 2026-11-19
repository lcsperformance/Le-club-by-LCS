import { seDeconnecter } from "@/app/auth/actions";
import { CarteAbonnement } from "@/components/CarteAbonnement";
import { ChoixFormule, type LiensPaiement } from "@/components/ChoixFormule";
import type { Utilisateur } from "@/lib/auth";

/** Page d'un membre dont la période payée est terminée (ou pas encore commencée). */
export function EcranAbonnement({
  utilisateur,
  liensPaiement,
  maintenant,
}: {
  utilisateur: Utilisateur;
  liensPaiement: LiensPaiement;
  maintenant: Date;
}) {
  return (
    <>
      <span className="logo" style={{ fontSize: 30, lineHeight: 1, marginTop: 8 }}>
        le club
      </span>
      <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
        Ton abonnement
      </h1>
      <p style={{ fontSize: 15, color: "#a9a4c9", lineHeight: 1.45 }}>
        Ton accès au Club n&apos;est pas ouvert en ce moment. Tes tests et tes zones sont conservés : tu les retrouves
        dès que tu reprends.
      </p>
      <CarteAbonnement abonnement={utilisateur.abonnement} maintenant={maintenant} />
      <ChoixFormule
        liens={liensPaiement}
        email={utilisateur.email}
        verbe={utilisateur.abonnement.statut === "inactif" ? "M'abonner" : "Me réabonner"}
      />
      <form action={seDeconnecter}>
        <button
          type="submit"
          style={{ width: "100%", minHeight: 50, border: 0, background: "none", color: "var(--texte)", font: "inherit", fontSize: 15, fontWeight: 800, cursor: "pointer" }}
        >
          Se déconnecter
        </button>
      </form>
    </>
  );
}
