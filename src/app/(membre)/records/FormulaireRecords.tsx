"use client";

import { useState, useTransition, type FormEvent } from "react";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { EPREUVES, formatTemps, lireRecords, type Epreuve, type Records } from "@/lib/records";
import { enregistrerRecords } from "./actions";
import styles from "./records.module.css";

const GROUPES = [
  { cle: "course", titre: "Course à pied" },
  { cle: "triathlon", titre: "Triathlon" },
] as const;

type Valeurs = Record<Epreuve, string>;

const depuisRecords = (records: Records) =>
  Object.fromEntries(EPREUVES.map((e) => [e.cle, records[e.cle] ? formatTemps(records[e.cle]!) : ""])) as Valeurs;

/** Un champ par épreuve (« 41:32 » ou « 1:32:10 »), vérifié ici puis par le serveur. */
export function FormulaireRecords({ records }: { records: Records }) {
  const [valeurs, setValeurs] = useState<Valeurs>(() => depuisRecords(records));
  const [erreurs, setErreurs] = useState<Partial<Record<Epreuve, string>>>({});
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  function changer(cle: Epreuve, valeur: string) {
    setValeurs((v) => ({ ...v, [cle]: valeur }));
    setErreurs((e) => ({ ...e, [cle]: undefined }));
    setMessage(null);
  }

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    // Même vérification que le serveur, pour répondre tout de suite.
    const lu = lireRecords(valeurs);
    if ("erreurs" in lu) {
      setErreurs(lu.erreurs);
      setMessage({ texte: "Vérifie les temps en rouge.", erreur: true });
      return;
    }
    demarrer(async () => {
      const r = await enregistrerRecords(valeurs);
      if (r.erreurs) {
        setErreurs(r.erreurs);
        setMessage({ texte: "Vérifie les temps en rouge.", erreur: true });
      } else if (r.erreur) {
        setMessage({ texte: r.erreur, erreur: true });
      } else {
        // Affiche les temps tels qu'enregistrés (« 41'32 » devient « 41:32 »).
        const propres = {} as Records;
        for (const ep of EPREUVES) if (lu.records[ep.cle] !== null) propres[ep.cle] = lu.records[ep.cle]!;
        setValeurs(depuisRecords(propres));
        setMessage({ texte: "Records enregistrés ✓", erreur: false });
      }
    });
  }

  return (
    <form onSubmit={enregistrer} noValidate style={{ display: "grid", gap: 16 }}>
      {GROUPES.map((g) => (
        <section key={g.cle} style={{ display: "grid", gap: 10 }} aria-labelledby={`groupe-${g.cle}`}>
          <h2 id={`groupe-${g.cle}`} className={styles.surtitre}>
            {g.titre}
          </h2>
          <Carte className={styles.carte}>
            {EPREUVES.filter((e) => e.groupe === g.cle).map((e) => (
              <div key={e.cle} className={styles.ligne}>
                <label className={styles.ligneHaut}>
                  <span className={styles.libelle}>{e.libelle}</span>
                  <input
                    className={styles.saisie}
                    name={e.cle}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    placeholder={`ex. ${e.exemple}`}
                    value={valeurs[e.cle]}
                    onChange={(ev) => changer(e.cle, ev.target.value)}
                    aria-label={`Record ${e.libelle}`}
                    aria-invalid={erreurs[e.cle] ? true : undefined}
                    aria-describedby={erreurs[e.cle] ? `erreur-${e.cle}` : undefined}
                    maxLength={12}
                  />
                </label>
                {erreurs[e.cle] && (
                  <p id={`erreur-${e.cle}`} className={styles.erreur}>
                    {erreurs[e.cle]}
                  </p>
                )}
              </div>
            ))}
          </Carte>
        </section>
      ))}
      <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…">
        Enregistrer mes records
      </BoutonPrincipal>
      {message && (
        <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : styles.succes}>
          {message.texte}
        </p>
      )}
    </form>
  );
}
