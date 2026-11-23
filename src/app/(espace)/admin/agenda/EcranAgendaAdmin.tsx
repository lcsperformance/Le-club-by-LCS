import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import styles from "@/app/(espace)/admin/ressources/admin-ressources.module.css";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { NOMS_TYPES, quandEvenement, type Evenement } from "@/lib/agenda";

/** Agenda côté admin : événements à venir puis passés, chacun modifiable. */
export function EcranAgendaAdmin({ evenements, maintenant }: { evenements: Evenement[]; maintenant: string }) {
  const aVenir = evenements.filter((e) => e.dates_a_confirmer || (e.fin ?? e.debut) >= maintenant);
  const passes = evenements.filter((e) => !aVenir.includes(e)).reverse();
  const liste = (titre: string, l: Evenement[]) => (
    <section style={{ display: "grid", gap: 8 }} aria-labelledby={`titre-${titre}`}>
      <h2 id={`titre-${titre}`} className={styles.sousTitre}>
        {titre} ({l.length})
      </h2>
      {!l.length && <p className={styles.vide}>Aucun événement.</p>}
      <ul className={styles.liste}>
        {l.map((e) => (
          <li key={e.id}>
            <Carte href={`/admin/agenda/${e.id}`} className={styles.ligne}>
              <span className={styles.ligneTexte}>
                <span className={styles.ligneTitre}>{e.titre}</span>
                <span className={styles.ligneMeta}>
                  {NOMS_TYPES[e.type]} · {quandEvenement(e)}
                </span>
              </span>
              <span aria-hidden>Modifier →</span>
            </Carte>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <>
      <RetourAdmin />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Agenda
        </h1>
        <p className={styles.aide} style={{ marginTop: 6 }}>
          FAQ en visio, webinaires, stages : les membres les voient dans Club › Agenda. Heures de Paris.
        </p>
      </header>
      <div className={styles.actions}>
        <BoutonPrincipal href="/admin/agenda/nouveau" compact>
          Ajouter un événement
        </BoutonPrincipal>
      </div>
      {liste("À venir", aVenir)}
      {liste("Passés", passes)}
    </>
  );
}
