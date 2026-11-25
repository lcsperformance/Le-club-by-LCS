"use client";

import { useActionState, useState } from "react";
import { BoutonPrincipal, Carte, Compteur, GrilleCartes } from "@/components/ui";
import { MESURES, type CleMesure, type Mesure, type ValeursTests } from "@/lib/tests-depart";
import { enregistrerTests, type EtatTests } from "./actions";
import { IconeSport } from "./IconeSport";
import styles from "./tests.module.css";

export function FormulaireTests({
  valeursInitiales,
  facultativesFaites = [],
}: {
  valeursInitiales: ValeursTests;
  /** Mesures facultatives renseignées au dernier test : cochées d'avance. */
  facultativesFaites?: CleMesure[];
}) {
  const [etat, action, enCours] = useActionState<EtatTests, FormData>(enregistrerTests, {});

  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      <GrilleCartes>
        {MESURES.map((m) => (
          <CarteMesure key={m.cle} mesure={m} valeurInitiale={valeursInitiales[m.cle]} faiteAuDepart={facultativesFaites.includes(m.cle)} />
        ))}
      </GrilleCartes>

      {etat.erreur && (
        <p className="message-erreur" role="alert">
          {etat.erreur}
        </p>
      )}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…">
        Calculer mes zones
      </BoutonPrincipal>
      <p style={{ fontSize: 13, color: "#a9a4c9", textAlign: "center" }}>Tu pourras refaire tes tests quand tu veux.</p>
    </form>
  );
}

/** Une mesure ; une mesure facultative n'est envoyée que si le membre coche « J'ai fait ce test ». */
function CarteMesure({ mesure: m, valeurInitiale, faiteAuDepart }: { mesure: Mesure; valeurInitiale: number; faiteAuDepart: boolean }) {
  const [faite, setFaite] = useState(!m.facultative || faiteAuDepart);

  return (
    <Carte as="section" style={{ display: "grid", gap: 12 }} aria-labelledby={`titre-${m.cle}`}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <IconeSport cle={m.cle} />
        <div>
          <h2 id={`titre-${m.cle}`} className={`titre-carte ${styles.sport}`}>
            {m.sport}
          </h2>
          <p className={styles.intitule}>
            {m.intitule}
            {m.facultative && " · facultatif"}
          </p>
        </div>
      </div>
      {m.facultative && (
        <>
          <p className={styles.aide}>Comparé à ta FTP, ce test nous aide à te suggérer un profil.</p>
          <label className={styles.case}>
            <input type="checkbox" checked={faite} onChange={(e) => setFaite(e.target.checked)} />
            J&apos;ai fait ce test
          </label>
        </>
      )}
      {faite && (
        <Compteur
          name={m.cle}
          valeurInitiale={valeurInitiale}
          pas={m.pas}
          min={m.min}
          max={m.max}
          afficher={m.afficher}
          libelleMoins={m.libelleMoins}
          libellePlus={m.libellePlus}
          intitule={`${m.sport}, ${m.intitule}`}
        />
      )}
    </Carte>
  );
}
