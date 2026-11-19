import { BoutonPrincipal, BoutonSecondaire } from "@/components/ui";
import { economieAnnuelle, equivalentMensuel, FORMULES, prixFormule, type Formule } from "@/lib/abonnement/formules";

export type LiensPaiement = Record<Formule, string | null>;

/** Lien de paiement Stripe avec l'e-mail du membre déjà rempli. */
const avecEmail = (lien: string, email: string) => `${lien}?prefilled_email=${encodeURIComponent(email)}`;

/** Choix entre le mois (49 €) et l'année (499 €), au moment de s'abonner ou de se réabonner. */
export function ChoixFormule({ liens, email, verbe }: { liens: LiensPaiement; email: string; verbe: string }) {
  if (!liens.mensuelle && !liens.annuelle) return null;
  return (
    <section aria-labelledby="titre-formule" style={{ display: "grid", gap: 10 }}>
      <h2 id="titre-formule" className="titre-carte" style={{ fontSize: 16, fontWeight: 800 }}>
        Choisis ta formule
      </h2>
      {liens.mensuelle && (
        <div style={{ display: "grid", gap: 6 }}>
          <BoutonPrincipal href={avecEmail(liens.mensuelle, email)}>
            {verbe} · {prixFormule("mensuelle")}
          </BoutonPrincipal>
          <p style={{ fontSize: 13, color: "#a9a4c9", textAlign: "center" }}>{FORMULES.mensuelle.engagement}</p>
        </div>
      )}
      {liens.annuelle && (
        <div style={{ display: "grid", gap: 6 }}>
          <BoutonSecondaire href={avecEmail(liens.annuelle, email)}>
            {verbe} à l&apos;année · {prixFormule("annuelle")}
          </BoutonSecondaire>
          <p style={{ fontSize: 13, color: "#a9a4c9", textAlign: "center" }}>
            Soit {equivalentMensuel()} : {economieAnnuelle()} d&apos;économie sur l&apos;année.
          </p>
        </div>
      )}
    </section>
  );
}
