import Link from "next/link";
import type { ReactNode } from "react";
import { seDeconnecter } from "@/app/auth/actions";
import type { Utilisateur } from "@/lib/auth";

/** En-tête des écrans membre : logo, titre, sous-titre ; bandeau si un admin visite. */
export function EnTeteMembre({
  utilisateur,
  titre,
  sousTitre,
}: {
  utilisateur: Utilisateur;
  titre: string;
  sousTitre?: ReactNode;
}) {
  return (
    <header style={{ display: "grid", gap: 16 }}>
      {utilisateur.role !== "membre" && (
        <p
          role="note"
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            padding: "10px 14px",
            borderRadius: 14,
            background: "rgba(222, 253, 98, 0.12)",
            border: "1px solid rgba(222, 253, 98, 0.4)",
          }}
        >
          Tu visites l&apos;espace membre en tant qu&apos;{utilisateur.role}.{" "}
          <Link href={utilisateur.role === "admin" ? "/admin" : "/coach"} className="lien">
            Revenir à mon espace
          </Link>
        </p>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="logo" style={{ fontSize: 30, lineHeight: 1 }}>
          le club
        </span>
        <form action={seDeconnecter}>
          <button
            type="submit"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: 0,
              background: "var(--aurore)",
              color: "var(--fond)",
              fontWeight: 800,
              fontSize: 17,
              cursor: "pointer",
            }}
          >
            {utilisateur.email.charAt(0).toUpperCase()}
          </button>
        </form>
      </div>
      <div>
        <h1 className="titre" style={{ fontSize: 32, lineHeight: 1.1, color: "#fff" }}>
          {titre}
        </h1>
        {sousTitre && (
          <p style={{ marginTop: 6, fontSize: 15, color: "var(--texte-doux)", fontWeight: 500 }}>{sousTitre}</p>
        )}
      </div>
    </header>
  );
}
