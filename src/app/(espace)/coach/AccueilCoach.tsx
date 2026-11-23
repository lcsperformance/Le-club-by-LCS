import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";

/** Contenu de l'espace coach. */
export function AccueilCoach({ email }: { email: string }) {
  return (
    <>
      <EnTeteEspace titre="Espace coach" email={email} />
      <Carte href="/club">
        <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>Le Club →</span>
        <span style={{ display: "block", marginTop: 6, fontSize: 13, color: "var(--texte-doux)" }}>
          Les canaux collectifs en direct (publier dans # annonces), la boîte à questions pour la FAQ en visio et l&apos;agenda.
        </span>
      </Carte>
      <Carte as="section">
        <p className="message-info">Ici, tu verras l&apos;historique de chaque athlète, en lecture seule.</p>
      </Carte>
    </>
  );
}
