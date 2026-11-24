import Link from "next/link";
import { seDeconnecter } from "@/app/auth/actions";
import { CarteAbonnement } from "@/components/CarteAbonnement";
import { ChampPrenom } from "@/components/ChampPrenom";
import { ChoixNiveauProfil } from "@/components/ChoixNiveauProfil";
import { ReglagesNotifications } from "@/components/ReglagesNotifications";
import { initiale } from "@/components/IdentiteMembre";
import { Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import type { SuggestionProfil } from "@/lib/profil-suggere";
import type { EtatAppareil } from "@/lib/notifications-navigateur";

const LIENS = [
  { href: "/records", libelle: "Mes records" },
  { href: "/progres", libelle: "Mes progrès" },
  { href: "/ressources/calculateur", libelle: "Calculateur LCS" },
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

function LienCarte({ href, libelle }: { href: string; libelle: string }) {
  return (
    <Carte href={href} style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 800 }}>{libelle}</span>
      <Fleche />
    </Carte>
  );
}

/** Écran Profil (maquette) : identité, niveau, profil, raccourcis et déconnexion. */
export function EcranProfil({
  utilisateur,
  maintenant,
  suggestion,
  notifications = { annonces: true, faq: true, evenements: true },
  appareilApercu,
}: {
  utilisateur: Utilisateur;
  maintenant: Date;
  /** Profil suggéré d'après les tests vélo. */
  suggestion?: SuggestionProfil;
  /** Réglages Notifications du membre (annonces, rappel FAQ, nouveaux événements). */
  notifications?: { annonces: boolean; faq: boolean; evenements: boolean };
  /** Aperçus seulement : état de l'appareil imposé. */
  appareilApercu?: EtatAppareil;
}) {
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
          {initiale(utilisateur)}
        </span>
        <div style={{ minWidth: 0 }}>
          <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.1, overflowWrap: "anywhere" }}>
            {utilisateur.prenom ?? "Mon profil"}
          </h1>
          <p style={{ fontSize: 14, color: "#a9a4c9", marginTop: 4, overflowWrap: "anywhere" }}>{utilisateur.email}</p>
          <p style={{ fontSize: 14, color: "#a9a4c9", fontWeight: 500 }}>{utilisateur.afficheCoach ? STATUT.coach : STATUT[utilisateur.role]}</p>
        </div>
      </header>

      <ChampPrenom prenom={utilisateur.prenom} />
      <ChampPrenom champ="nom" prenom={utilisateur.nom} />

      {/* L'équipe du Club (coach, admin) n'a pas d'abonnement. */}
      {utilisateur.role === "membre" && <CarteAbonnement abonnement={utilisateur.abonnement} maintenant={maintenant} />}

      <ChoixNiveauProfil
        niveau={utilisateur.niveau}
        profil={utilisateur.profil}
        ecran="profil"
        suggestion={suggestion}
        entreLesDeux={<LienCarte href="/saison" libelle="Ma saison" />}
      />

      <ReglagesNotifications reglages={notifications} apercu={appareilApercu} />

      {LIENS.map((l) => (
        <LienCarte key={l.href} {...l} />
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
