import Link from "next/link";
import { PAGES_LEGALES } from "@/lib/legal";

/** Liens discrets vers les pages légales (bas de la connexion et de l'abonnement). */
export function LiensLegaux() {
  return (
    <nav aria-label="Informations légales" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 14px", fontSize: 12, marginTop: 8 }}>
      {PAGES_LEGALES.map((p) => (
        <Link key={p.href} href={p.href} style={{ color: "var(--texte-doux)", textDecoration: "underline", minHeight: 32, display: "inline-flex", alignItems: "center" }}>
          {p.libelle === "Conditions générales de vente" ? "CGV" : p.libelle === "Politique de confidentialité" ? "Confidentialité" : p.libelle}
        </Link>
      ))}
    </nav>
  );
}
