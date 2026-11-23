"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BoutonSecondaire, Carte } from "@/components/ui";
import type { CommentaireAdmin } from "@/lib/admin/ressources-serveur";
import { dateCommentaire } from "@/lib/ressources";
import { modererCommentaire } from "./actions";
import styles from "./admin-ressources.module.css";

const ROLES: Record<string, string> = { coach: "Coach", admin: "Équipe du Club" };

/** Tous les commentaires, du plus récent au plus ancien : l'admin peut en supprimer (noté dans le journal). */
export function ModerationCommentaires({ commentaires }: { commentaires: CommentaireAdmin[] }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function supprimer(c: CommentaireAdmin) {
    if (!window.confirm(`Supprimer le commentaire de ${c.auteur} ? La suppression sera notée dans le journal.`)) return;
    setErreur(null);
    demarrer(async () => {
      const r = await modererCommentaire(c.id);
      if (r.erreur) setErreur(r.erreur);
      router.refresh();
    });
  }

  return (
    <>
      {erreur && (
        <p role="alert" className="message-erreur">
          {erreur}
        </p>
      )}
      {!commentaires.length && <p className={styles.vide}>Aucun commentaire pour l&apos;instant.</p>}
      <ul className={styles.liste}>
        {commentaires.map((c) => (
          <Carte as="li" key={c.id} className={styles.commentaire}>
            <p className={styles.commentaireEntete}>
              <span>
                {c.auteur}
                {ROLES[c.auteur_role] && ` · ${ROLES[c.auteur_role]}`} <span className={styles.commentaireQuand}>· {dateCommentaire(c.cree_le)}</span>
              </span>
              <Link href={`/ressources/contenu/${c.ressource_id}`} className="lien">
                {c.titre}
              </Link>
            </p>
            <p className={styles.commentaireTexte}>{c.texte}</p>
            <div>
              <BoutonSecondaire type="button" compact onClick={() => supprimer(c)} disabled={enCours} className={styles.danger}>
                Supprimer
              </BoutonSecondaire>
            </div>
          </Carte>
        ))}
      </ul>
    </>
  );
}
