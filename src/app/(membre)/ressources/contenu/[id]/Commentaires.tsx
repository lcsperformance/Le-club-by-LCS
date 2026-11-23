"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Carte } from "@/components/ui";
import { dateCommentaire, LONGUEUR_MAX_COMMENTAIRE, lireCommentaire, type Commentaire } from "@/lib/ressources";
import { publierCommentaire, supprimerCommentaire } from "../../actions";
import styles from "../../ressources.module.css";

const ROLES: Record<string, string> = { coach: "Coach", admin: "Équipe du Club" };

/** Commentaires sous une vidéo (maquette) : liste, puis « Ajouter un commentaire ». Pas de votes. */
export function Commentaires({ id, commentaires, moderateur }: { id: string; commentaires: Commentaire[]; moderateur: boolean }) {
  const router = useRouter();
  const [texte, setTexte] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function publier(e: FormEvent) {
    e.preventDefault();
    const lu = lireCommentaire(texte);
    if ("erreur" in lu) {
      setErreur(lu.erreur);
      return;
    }
    setErreur(null);
    demarrer(async () => {
      const r = await publierCommentaire(id, lu.texte);
      if (r.erreur) setErreur(r.erreur);
      else {
        setTexte("");
        router.refresh();
      }
    });
  }

  function supprimer(cid: string) {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    demarrer(async () => {
      const r = await supprimerCommentaire(cid);
      if (r.erreur) setErreur(r.erreur);
      else router.refresh();
    });
  }

  return (
    <Carte as="section" className={styles.commentaires} aria-labelledby="titre-commentaires">
      <h2 id="titre-commentaires" className={styles.commentairesTitre}>
        Commentaires
      </h2>
      {commentaires.length ? (
        <ol className={styles.liste}>
          {commentaires.map((c) => (
            <li key={c.id} className={styles.commentaire}>
              <p className={styles.commentaireEntete}>
                <span>
                  {c.auteur}
                  {ROLES[c.auteur_role] && ` · ${ROLES[c.auteur_role]}`} <span className={styles.commentaireQuand}>· {dateCommentaire(c.cree_le)}</span>
                </span>
                {(c.mien || moderateur) && (
                  <button type="button" className={styles.supprimer} onClick={() => supprimer(c.id)} disabled={enCours}>
                    Supprimer
                  </button>
                )}
              </p>
              <p className={styles.commentaireTexte}>{c.texte}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.vide}>Aucun commentaire pour l&apos;instant. Lance la discussion !</p>
      )}
      <form className={styles.saisie} onSubmit={publier}>
        <input
          className={styles.saisieChamp}
          type="text"
          aria-label="Ton commentaire"
          placeholder="Ajouter un commentaire"
          value={texte}
          maxLength={LONGUEUR_MAX_COMMENTAIRE}
          onChange={(e) => {
            setTexte(e.target.value);
            setErreur(null);
          }}
        />
        <button type="submit" className={styles.publier} aria-label="Publier" disabled={enCours}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--fond)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 12l16-8-6 16-3-7z" />
          </svg>
        </button>
      </form>
      {erreur && (
        <p role="alert" className="message-erreur">
          {erreur}
        </p>
      )}
    </Carte>
  );
}
