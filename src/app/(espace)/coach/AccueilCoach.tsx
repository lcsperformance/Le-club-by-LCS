import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";

/** Contenu de l'espace coach. */
export function AccueilCoach({ email }: { email: string }) {
  return (
    <>
      <EnTeteEspace titre="Espace coach" email={email} />
      <Carte as="section">
        <p className="message-info">Ici, tu verras l&apos;historique de chaque athlète, en lecture seule.</p>
      </Carte>
    </>
  );
}
