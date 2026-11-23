import { Carte } from "@/components/ui";
import { NOMS_TYPES, pastilleDate, quandEvenement, type Evenement } from "@/lib/agenda";
import styles from "../club.module.css";

/** Carte d'un événement daté (maquette) : pastille du jour, titre, type, quand, lieu, liens. */
export function CarteEvenement({ e }: { e: Evenement }) {
  const p = pastilleDate(e.debut);
  return (
    <Carte as="li" className={styles.evenement}>
      <span className={styles.pastille} aria-hidden>
        <span className={styles.pastilleJour}>{p.jour}</span>
        <span className={styles.pastilleMois}>{p.mois}</span>
      </span>
      <span className={styles.evenementTexte}>
        <span className={styles.evenementTitre}>{e.titre}</span>
        <span className={styles.evenementType}>{NOMS_TYPES[e.type]}</span>
        <span className={styles.evenementQuand}>
          {quandEvenement(e)}
          {e.lieu && ` · ${e.lieu}`}
        </span>
        {e.description && <span className={styles.evenementDescription}>{e.description}</span>}
        <span className={styles.evenementLiens}>
          <a href={`/club/agenda/${e.id}/ics`} className="lien">
            Ajouter à mon agenda
          </a>
          {e.lien && (
            <a href={e.lien} className="lien" target="_blank" rel="noopener noreferrer">
              {e.type === "faq" || e.type === "webinaire" ? "Rejoindre la visio" : "En savoir plus"}
            </a>
          )}
        </span>
      </span>
    </Carte>
  );
}
