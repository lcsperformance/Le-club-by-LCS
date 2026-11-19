import Link from "next/link";

/** Retour, titre et sous-titre de l'écran « Mes zones ». */
export function EnTeteZones() {
  return (
    <>
      <Link href="/accueil" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, minHeight: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Accueil
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Mes zones
        </h1>
        <p style={{ fontSize: 15, color: "#a9a4c9", marginTop: 8, lineHeight: 1.45 }}>
          Calculées à partir de tes tests de départ.
        </p>
      </header>
    </>
  );
}
