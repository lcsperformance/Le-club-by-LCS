"use client";

import { useState, useTransition, type FormEvent } from "react";
import { BoutonPrincipal, Carte, Champ } from "@/components/ui";
import { LONGUEUR_MAX_COMMENTAIRE, lireRessentiSaisi, type Ressenti } from "@/lib/ressenti";
import { enregistrerRessenti, marquerSeance } from "../actions";
import styles from "./seance.module.css";

const NOTES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/**
 * « Marquer comme faite », puis le ressenti (maquette) : RPE de 1 à 10, douleur ou gêne, commentaire.
 * ressenti : null tant que la séance n'est pas marquée faite ce jour-là.
 * interdit : raison pour laquelle on ne peut pas encore (ou plus) marquer la séance, sinon null.
 */
export function SuiviSeance({ seanceId, jour, ressenti, interdit }: { seanceId: string; jour: string; ressenti: Ressenti | null; interdit: string | null }) {
  const [faite, setFaite] = useState(ressenti !== null);
  const [rpe, setRpe] = useState<number | null>(ressenti?.rpe ?? null);
  const [douleur, setDouleur] = useState(ressenti?.douleur ?? false);
  const [commentaire, setCommentaire] = useState(ressenti?.commentaire ?? "");
  const [enregistre, setEnregistre] = useState(ressenti?.rpe != null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  if (interdit) return <p className="message-info">{interdit}</p>;

  function basculer() {
    const voulu = !faite;
    setFaite(voulu);
    setMessage(null);
    demarrer(async () => {
      const r = await marquerSeance(seanceId, jour, voulu);
      if (r.erreur) {
        setFaite(!voulu);
        setMessage({ texte: r.erreur, erreur: true });
      } else if (!voulu) {
        setRpe(null);
        setDouleur(false);
        setCommentaire("");
        setEnregistre(false);
      }
    });
  }

  function modifie() {
    setEnregistre(false);
    setMessage(null);
  }

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    const saisie = { rpe, douleur, commentaire };
    // Même vérification que le serveur, pour répondre tout de suite.
    const lu = lireRessentiSaisi(saisie);
    if ("erreur" in lu) {
      setMessage({ texte: lu.erreur, erreur: true });
      return;
    }
    demarrer(async () => {
      const r = await enregistrerRessenti(seanceId, jour, saisie);
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      else {
        setEnregistre(true);
        setMessage({ texte: "Ressenti enregistré ✓", erreur: false });
      }
    });
  }

  return (
    <>
      <button type="button" className={styles.boutonFaite} aria-pressed={faite} onClick={basculer} disabled={enCours}>
        {faite ? "Séance faite ✓" : "Marquer comme faite"}
      </button>

      {faite && (
        <Carte as="section" aria-labelledby="titre-ressenti">
          <form onSubmit={enregistrer} className={styles.ressenti} noValidate>
            <div>
              <h2 id="titre-ressenti" className={styles.ressentiTitre}>
                Ressenti de la séance
              </h2>
              <p className={styles.ressentiAide}>RPE : 1 = très facile, 10 = effort maximal.</p>
            </div>
            <div className={styles.notes} role="group" aria-label="RPE de 1 à 10">
              {NOTES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={styles.note}
                  aria-pressed={rpe === n}
                  aria-label={`RPE ${n} sur 10`}
                  onClick={() => {
                    setRpe(n);
                    modifie();
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={douleur}
              className={styles.douleur}
              onClick={() => {
                setDouleur((d) => !d);
                modifie();
              }}
            >
              <span>Douleur ou gêne</span>
              <span className={styles.interrupteur} aria-hidden>
                <span />
              </span>
            </button>
            <Champ
              libelle="Commentaire (facultatif)"
              name="commentaire"
              placeholder="Une sensation, un souci…"
              value={commentaire}
              maxLength={LONGUEUR_MAX_COMMENTAIRE}
              onChange={(e) => {
                setCommentaire(e.target.value);
                modifie();
              }}
            />
            <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…">
              {enregistre ? "Ressenti enregistré" : "Enregistrer mon ressenti"}
            </BoutonPrincipal>
            <p className={styles.confidentiel}>Visible seulement par toi et ton coach.</p>
          </form>
        </Carte>
      )}

      {message && (
        <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : styles.succes}>
          {message.texte}
        </p>
      )}
    </>
  );
}
