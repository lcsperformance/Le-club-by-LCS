import { BoutonPrincipal, Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { EnTeteAccueil } from "./EnTeteAccueil";

/** Contenu de l'accueil membre. */
export function AccueilMembre({ utilisateur, testsFaits, aujourdhui }: { utilisateur: Utilisateur; testsFaits: boolean; aujourdhui: Date }) {
  return (
    <>
      <EnTeteAccueil utilisateur={utilisateur} aujourdhui={aujourdhui} />

      {testsFaits ? (
        <Carte href="/zones" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", flex: "none" }} />
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Tes zones sont à jour</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Voir</span>
        </Carte>
      ) : (
        <section
          aria-labelledby="etape-tests"
          style={{
            background: "var(--aurore)",
            color: "var(--fond)",
            borderRadius: 20,
            padding: 18,
            display: "grid",
            gap: 10,
            boxShadow: "0 14px 34px rgba(250, 148, 255, 0.3)",
          }}
        >
          <span
            style={{
              justifySelf: "start",
              background: "var(--accent)",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            Étape 1
          </span>
          <h2 id="etape-tests" className="titre-carte" style={{ fontSize: 19, lineHeight: 1.2 }}>
            Définis tes zones pour débloquer tes allures
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.4 }}>Quatre mesures à faire en autonomie : course, vélo, natation et cardio.</p>
          <BoutonPrincipal href="/tests" style={{ minHeight: 48, fontSize: 16, boxShadow: "none" }}>
            Faire mes tests
          </BoutonPrincipal>
        </section>
      )}

      <Carte as="section">
        <p className="message-info">Ton programme arrive bientôt. Lancement le 1er janvier 2027.</p>
      </Carte>
    </>
  );
}
