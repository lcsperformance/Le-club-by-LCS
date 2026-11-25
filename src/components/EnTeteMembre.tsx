import { SymboleClub } from "@/components/SymboleClub";
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
      {/* Logo et pastille : masqués sur ordinateur (--ligne-entete), où le menu latéral les a déjà. */}
      <div style={{ display: "var(--ligne-entete, flex)", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SymboleClub hauteur={30} />
          <span className="logo" style={{ fontSize: 30, lineHeight: 1 }}>
            le club
          </span>
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
