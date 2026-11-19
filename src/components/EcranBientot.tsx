import Link from "next/link";
import { Carte } from "@/components/ui";

/** Écran d'attente pour une fonctionnalité pas encore disponible, ouvert depuis le Profil. */
export function EcranBientot({ titre, description }: { titre: string; description: string }) {
  return (
    <>
      <Link href="/profil" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 700, minHeight: 44 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Profil
      </Link>
      <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
        {titre}
      </h1>
      <Carte as="section" style={{ display: "grid", gap: 8 }}>
        <span
          style={{
            justifySelf: "start",
            background: "var(--accent)",
            color: "var(--fond)",
            fontSize: 12,
            fontWeight: 800,
            borderRadius: 999,
            padding: "4px 12px",
          }}
        >
          Bientôt disponible
        </span>
        <p className="message-info">{description}</p>
      </Carte>
    </>
  );
}
