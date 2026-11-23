"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import styles from "@/app/(espace)/admin/ressources/admin-ressources.module.css";
import { BoutonSecondaire, Carte } from "@/components/ui";
import { dateCommentaire } from "@/lib/ressources";
import type { Question } from "@/lib/questions";
import { marquerQuestion, supprimerQuestion } from "./actions";

const ROLES: Record<string, string> = { coach: "Coach", admin: "Équipe du Club" };

/** Boîte à questions côté admin : préparer la FAQ en visio (à traiter / traitées), sans votes. */
export function EcranQuestionsAdmin({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [filtre, setFiltre] = useState<"a_traiter" | "traitees">("a_traiter");
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();
  const aTraiter = questions.filter((q) => !q.traitee_le).sort((a, b) => (a.cree_le < b.cree_le ? -1 : 1));
  const traitees = questions.filter((q) => q.traitee_le).sort((a, b) => (a.traitee_le! > b.traitee_le! ? -1 : 1));
  const liste = filtre === "a_traiter" ? aTraiter : traitees;

  const lancer = (action: () => Promise<{ erreur?: string }>, confirmation?: string) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setMessage(null);
    demarrer(async () => {
      const r = await action();
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      router.refresh();
    });
  };

  async function copier() {
    const texte = aTraiter.map((q, i) => `${i + 1}. ${q.texte} (${q.auteur})`).join("\n");
    try {
      await navigator.clipboard.writeText(texte);
      setMessage({ texte: `${aTraiter.length} question${aTraiter.length > 1 ? "s" : ""} copiée${aTraiter.length > 1 ? "s" : ""} ✓`, erreur: false });
    } catch {
      setMessage({ texte: "Copie impossible sur cet appareil : sélectionne le texte à la main.", erreur: true });
    }
  }

  return (
    <>
      <RetourAdmin />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Boîte à questions
        </h1>
        <p className={styles.aide} style={{ marginTop: 6 }}>
          Les questions des membres pour la FAQ en visio, sans votes. Marque-les traitées après la FAQ.
        </p>
      </header>
      <div className={styles.types} role="group" aria-label="Filtrer les questions">
        <button type="button" className={styles.type} aria-pressed={filtre === "a_traiter"} onClick={() => setFiltre("a_traiter")}>
          À traiter ({aTraiter.length})
        </button>
        <button type="button" className={styles.type} aria-pressed={filtre === "traitees"} onClick={() => setFiltre("traitees")}>
          Traitées ({traitees.length})
        </button>
      </div>
      {filtre === "a_traiter" && aTraiter.length > 0 && (
        <div>
          <BoutonSecondaire type="button" compact onClick={copier}>
            Copier la liste pour la FAQ
          </BoutonSecondaire>
        </div>
      )}
      {message && (
        <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : styles.aide}>
          {message.texte}
        </p>
      )}
      {!liste.length && <p className={styles.vide}>{filtre === "a_traiter" ? "Aucune question à traiter." : "Aucune question traitée pour l'instant."}</p>}
      <ol className={styles.liste}>
        {liste.map((q) => (
          <Carte as="li" key={q.id} className={styles.commentaire}>
            <p className={styles.commentaireEntete}>
              <span>
                {q.auteur}
                {ROLES[q.auteur_role] && ` · ${ROLES[q.auteur_role]}`} <span className={styles.commentaireQuand}>· {dateCommentaire(q.cree_le)}</span>
              </span>
              {q.traitee_le && <span className={styles.commentaireQuand}>Traitée le {dateCommentaire(q.traitee_le)}</span>}
            </p>
            <p className={styles.commentaireTexte}>{q.texte}</p>
            <div className={styles.actions}>
              <BoutonSecondaire type="button" compact disabled={enCours} onClick={() => lancer(() => marquerQuestion(q.id, !q.traitee_le))}>
                {q.traitee_le ? "Remettre à traiter" : "Marquer traitée"}
              </BoutonSecondaire>
              <BoutonSecondaire
                type="button"
                compact
                disabled={enCours}
                className={styles.danger}
                onClick={() => lancer(() => supprimerQuestion(q.id), `Supprimer la question de ${q.auteur} ?`)}
              >
                Supprimer
              </BoutonSecondaire>
            </div>
          </Carte>
        ))}
      </ol>
    </>
  );
}
