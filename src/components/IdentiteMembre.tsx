import Link from "next/link";
import type { Utilisateur } from "@/lib/auth";

/** Initiale affichée dans la pastille ronde : celle du prénom, sinon celle de l'e-mail. */
export const initiale = (u: Pick<Utilisateur, "prenom" | "email">) => (u.prenom ?? u.email).charAt(0).toUpperCase();

/** Pastille ronde (maquette) qui ouvre le Profil. */
export function PastilleProfil({ utilisateur }: { utilisateur: Utilisateur }) {
  return (
    <Link
      href="/profil"
      aria-label="Mon profil"
      title="Mon profil"
      style={{
        width: 44,
        height: 44,
        flex: "none",
        borderRadius: "50%",
        background: "var(--aurore)",
        color: "var(--fond)",
        fontWeight: 800,
        fontSize: 17,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {initiale(utilisateur)}
    </Link>
  );
}

/** Rappel affiché quand l'équipe du Club (admin, coach) visite l'espace membre. */
export function BandeauVisite({ utilisateur }: { utilisateur: Utilisateur }) {
  if (utilisateur.role === "membre") return null;
  return (
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
  );
}
