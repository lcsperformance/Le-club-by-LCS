import Link from "next/link";
import { seDeconnecter } from "@/app/auth/actions";
import { ChoixNiveauProfil } from "@/components/ChoixNiveauProfil";
import { Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";

const LIENS = [
  { href: "/records", libelle: "Mes records" },
  { href: "/progres", libelle: "Mes progrès" },
  { href: "/zones", libelle: "Mes zones" },
  { href: "/tests", libelle: "Refaire mes tests" },
];

const STATUT: Record<Utilisateur["role"], string> = {
  membre: "Membre du Club",
  coach: "Coach du Club",
  admin: "Administration du Club",
};

function Fleche() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Écran Profil (maquette) : identité, niveau, profil, raccourcis et déconnexion. */
export function EcranProfil({ utilisateur }: { utilisateur: Utilisateur }) {
  return (
    <>
      <Link href="/accueil" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, minHeight: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Accueil
      </Link>

      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          aria-hidden
          style={{
            width: 72,
            height: 72,
            flex: "none",
            borderRadius: "50%",
            background: "var(--aurore)",
            color: "var(--fond)",
            fontSize: 30,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {utilisateur.email.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.1 }}>
            Mon profil
          </h1>
          <p style={{ fontSize: 14, color: "#a9a4c9", marginTop: 4, overflowWrap: "anywhere" }}>{utilisateur.email}</p>
          <p style={{ fontSize: 14, color: "#a9a4c9", fontWeight: 500 }}>{STATUT[utilisateur.role]}</p>
        </div>
      </header>

      <ChoixNiveauProfil niveau={utilisateur.niveau} profil={utilisateur.profil} ecran="profil" />

      {LIENS.map((l) => (
        <Carte key={l.href} href={l.href} style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{l.libelle}</span>
          <Fleche />
        </Carte>
      ))}

      <form action={seDeconnecter}>
        <button
          type="submit"
          style={{
            width: "100%",
            minHeight: 50,
            border: 0,
            background: "none",
            color: "var(--texte)",
            font: "inherit",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Se déconnecter
        </button>
      </form>
      <div style={{ height: 28 }} />
    </>
  );
}
