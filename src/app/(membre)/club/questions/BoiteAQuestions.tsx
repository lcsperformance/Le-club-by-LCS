"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { BoutonPrincipal, Carte, DeuxColonnes } from "@/components/ui";
import { LONGUEUR_MAX_QUESTION, lireQuestion, sousTitreQuestion, type Question } from "@/lib/questions";
import { poserQuestion, retirerQuestion } from "../actions";
import styles from "../club.module.css";

/** « Ta question pour la FAQ » et la liste des questions déposées (sans votes). */
export function BoiteAQuestions({ questions, moi, avant }: { questions: Question[]; moi: string; avant?: ReactNode }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  function envoyer(e: FormEvent) {
    e.preventDefault();
    const lu = lireQuestion(texte);
    if ("erreur" in lu) {
      setMessage({ texte: lu.erreur, erreur: true });
      return;
    }
    demarrer(async () => {
      const r = await poserQuestion(lu.texte);
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      else {
        setTexte("");
        setMessage({ texte: "Question envoyée ✓ Martin y répondra pendant la prochaine FAQ en visio.", erreur: false });
        router.refresh();
      }
    });
  }

  function retirer(q: Question) {
    if (!window.confirm("Retirer ta question ?")) return;
    demarrer(async () => {
      const r = await retirerQuestion(q.id);
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      else router.refresh();
    });
  }

  return (
    <>
      {/* Sur ordinateur : prochaine FAQ et formulaire à gauche, questions déposées à droite. */}
      <DeuxColonnes
        principale={
          <>
            {avant}
            <Carte as="section">
              <form className={styles.formQuestion} onSubmit={envoyer}>
                <label htmlFor="champ-question" className={styles.libelleQuestion}>
                  Ta question pour la FAQ
                </label>
                <input
                  id="champ-question"
                  className={styles.champ}
                  style={{ width: "100%", borderRadius: 14 }}
                  type="text"
                  placeholder="Ex. Comment gérer ma nutrition en course ?"
                  value={texte}
                  maxLength={LONGUEUR_MAX_QUESTION}
                  onChange={(e) => {
                    setTexte(e.target.value);
                    setMessage(null);
                  }}
                />
                <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Envoi…">
                  Envoyer ma question
                </BoutonPrincipal>
                {message && (
                  <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : "message-info"}>
                    {message.texte}
                  </p>
                )}
              </form>
            </Carte>
          </>
        }
        laterale={
          <>
            <h2 className={styles.compte}>
              {questions.length} question{questions.length > 1 ? "s" : ""} déposée{questions.length > 1 ? "s" : ""}
            </h2>
            <ul className={styles.canaux}>
              {questions.map((q) => (
                <Carte as="li" key={q.id} className={`${styles.question} ${q.traitee_le ? styles.traitee : ""}`}>
                  <p className={styles.questionTexte}>{q.texte}</p>
                  <p className={styles.questionMeta}>{sousTitreQuestion(q, moi)}</p>
                  {q.membre_id === moi && !q.traitee_le && (
                    <button type="button" className={styles.supprimer} style={{ justifySelf: "start" }} onClick={() => retirer(q)} disabled={enCours}>
                      Retirer ma question
                    </button>
                  )}
                </Carte>
              ))}
            </ul>
          </>
        }
      />
    </>
  );
}
