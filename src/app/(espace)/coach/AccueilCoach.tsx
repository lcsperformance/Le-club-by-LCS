import type { ReactNode } from "react";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";
import type { AthleteCoach } from "@/lib/coach";
import styles from "./coach.module.css";
import { ListeAthletes } from "./ListeAthletes";

/**
 * Espace coach (maquette Coach) : liste des athlètes à gauche, fiche à droite (sur téléphone : l'une puis l'autre).
 * fiche : la fiche de l'athlète choisi ; sans fiche, un lien vers le Club et un rappel.
 */
export function AccueilCoach({ email, athletes, choisi, fiche }: { email: string; athletes: AthleteCoach[]; choisi?: string; fiche?: ReactNode }) {
  return (
    <>
      <EnTeteEspace titre="Espace coach" email={email} />
      <div className={styles.mise}>
        <div className={fiche ? styles.masquerSurTelephone : undefined}>
          <ListeAthletes athletes={athletes} choisi={choisi} />
        </div>
        {fiche ?? (
          <div style={{ display: "grid", gap: 12 }}>
            <Carte href="/club">
              <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>Le Club →</span>
              <span style={{ display: "block", marginTop: 6, fontSize: 13, color: "var(--texte-doux)" }}>
                Les canaux collectifs en direct (publier dans # annonces), la boîte à questions pour la FAQ en visio et l&apos;agenda. Pas de
                messages privés : tout le monde profite des réponses.
              </span>
            </Carte>
            <Carte as="section">
              <p className="message-info">Choisis un athlète pour voir son niveau, ses objectifs et ses séances, en lecture seule.</p>
            </Carte>
          </div>
        )}
      </div>
    </>
  );
}
