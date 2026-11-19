"use client";

import { useActionState } from "react";
import { BoutonPrincipal, Carte, Compteur } from "@/components/ui";
import { MESURES, type ValeursTests } from "@/lib/tests-depart";
import { enregistrerTests, type EtatTests } from "./actions";
import { IconeSport } from "./IconeSport";
import styles from "./tests.module.css";

export function FormulaireTests({ valeursInitiales }: { valeursInitiales: ValeursTests }) {
  const [etat, action, enCours] = useActionState<EtatTests, FormData>(enregistrerTests, {});

  return (
    <form action={action} style={{ display: "grid", gap: 16 }}>
      {MESURES.map((m) => (
        <Carte key={m.cle} as="section" style={{ display: "grid", gap: 12 }} aria-labelledby={`titre-${m.cle}`}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <IconeSport cle={m.cle} />
            <div>
              <h2 id={`titre-${m.cle}`} className={`titre-carte ${styles.sport}`}>
                {m.sport}
              </h2>
              <p className={styles.intitule}>{m.intitule}</p>
            </div>
          </div>
          <Compteur
            name={m.cle}
            valeurInitiale={valeursInitiales[m.cle]}
            pas={m.pas}
            min={m.min}
            max={m.max}
            afficher={m.afficher}
            libelleMoins={m.libelleMoins}
            libellePlus={m.libellePlus}
            intitule={`${m.sport}, ${m.intitule}`}
          />
        </Carte>
      ))}

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
