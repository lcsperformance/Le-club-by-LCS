import type { ReactNode } from "react";
import type { Utilisateur } from "@/lib/auth";
import { BandeauVisite, PastilleProfil } from "./IdentiteMembre";

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
      <BandeauVisite utilisateur={utilisateur} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="logo" style={{ fontSize: 30, lineHeight: 1 }}>
          le club
        </span>
        <PastilleProfil utilisateur={utilisateur} />
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
