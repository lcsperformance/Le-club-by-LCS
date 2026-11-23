import { EnTeteMembre } from "@/components/EnTeteMembre";
import { quandEvenement, type Evenement } from "@/lib/agenda";
import type { Utilisateur } from "@/lib/auth";
import { trierQuestions, type Question } from "@/lib/questions";
import styles from "../club.module.css";
import { OngletsClub } from "../EcranClub";
import { BoiteAQuestions } from "./BoiteAQuestions";

/** Boîte à questions (maquette) : prochaine FAQ en visio, « Ta question », questions déposées (sans votes). */
export function EcranQuestions({ utilisateur, prochaine, questions }: { utilisateur: Utilisateur; prochaine: Evenement | null; questions: Question[] }) {
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Le Club" />
      <OngletsClub actif="questions" />
      <section className={styles.prochaineFaq} aria-labelledby="titre-prochaine-faq">
        <p id="titre-prochaine-faq" className={styles.prochaineSurtitre}>
          Prochaine FAQ en visio
        </p>
        <p className={styles.prochaineQuand}>{prochaine ? quandEvenement(prochaine) : "Date bientôt annoncée"}</p>
        <p className={styles.prochaineTexte}>Le coach répond en direct aux questions déposées. Pas de réponse individuelle : tout le monde en profite.</p>
        {prochaine && (
          <a href={`/club/agenda/${prochaine.id}/ics`} className={styles.boutonAgenda}>
            Ajouter à mon agenda
          </a>
        )}
      </section>
      <BoiteAQuestions questions={trierQuestions(questions)} moi={utilisateur.id} />
      <div style={{ height: 8 }} />
    </>
  );
}
