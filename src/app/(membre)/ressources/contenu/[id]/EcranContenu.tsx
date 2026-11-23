import Link from "next/link";
import { Cadenas } from "@/components/Cadenas";
import { Carte } from "@/components/ui";
import { badgeSuivi, estDebloquee, lecteurYoutube, themeParCle, type Commentaire, type Media, type Ressource, type Suivi } from "@/lib/ressources";
import { BoutonFavori } from "../../BoutonFavori";
import styles from "../../ressources.module.css";
import { BoutonVue } from "./BoutonSuivi";
import { Commentaires } from "./Commentaires";

/**
 * Page d'un contenu (maquette) : la vidéo (YouTube non répertoriée) ou l'aperçu du PDF, le titre,
 * « Ajouter aux favoris » et « Marquer comme vue » / « Télécharger le PDF », puis les commentaires (vidéos).
 * semaine : ancienneté du membre (null pour l'équipe du Club) ; un contenu verrouillé ne montre rien.
 */
export function EcranContenu({
  ressource: r,
  semaine,
  media,
  suivi,
  commentaires = [],
  moderateur = false,
}: {
  ressource: Ressource;
  semaine: number | null;
  media?: Media;
  suivi?: Suivi;
  commentaires?: Commentaire[];
  moderateur?: boolean;
}) {
  const theme = themeParCle(r.theme);
  const rubrique = theme?.sous_rubriques.find((s) => s.cle === r.sous_rubrique);
  const debloquee = estDebloquee(r, semaine);

  return (
    <>
      <Link href={theme ? `/ressources/${theme.cle}` : "/ressources"} className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        {theme?.nom ?? "Ressources"}
      </Link>

      {!debloquee ? (
        <div className={`${styles.media} ${styles.mediaPdf}`}>
          <Cadenas />
          <span className={styles.mediaTexte}>Débloqué en semaine {r.semaine_deblocage} de ton abonnement</span>
        </div>
      ) : r.type === "video" && media?.youtube_id ? (
        <iframe
          className={styles.lecteur}
          src={lecteurYoutube(media.youtube_id)}
          title={r.titre}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : r.type === "video" ? (
        <div className={`${styles.media} ${styles.mediaVideo}`}>
          <span className={styles.lectureGrande} aria-hidden>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="var(--abysse)">
              <path d="M8 5l11 7-11 7z" />
            </svg>
          </span>
          <span className={styles.mediaTexte}>Vidéo bientôt disponible</span>
        </div>
      ) : (
        <div className={`${styles.media} ${styles.mediaPdf}`}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 3h8l4 4v14H6z" />
            <path d="M14 3v4h4M9 13h6M9 17h6" />
          </svg>
          <span>Aperçu du PDF</span>
        </div>
      )}

      <div>
        <p className={styles.surtitre}>
          {r.type === "video" ? "Vidéo" : "PDF"}
          {rubrique && ` · ${rubrique.nom}`}
        </p>
        <h1 className="titre" style={{ fontSize: 20, lineHeight: 1.2, marginTop: 4 }}>
          {r.titre}
        </h1>
      </div>

      {debloquee && (
        <>
          <div className={styles.boutons}>
            <BoutonFavori id={r.id} titre={r.titre} favori={!!suivi?.favori} grand />
            {r.type === "video" ? (
              <BoutonVue id={r.id} vue={!!suivi?.consulte_le} />
            ) : media?.fichier_disponible ? (
              <a href={`/ressources/contenu/${r.id}/telecharger`} className={`${styles.bouton} ${styles.boutonSuivi}`}>
                {badgeSuivi(r, suivi) ? "Téléchargé ✓" : "Télécharger le PDF"}
              </a>
            ) : (
              <span className={`${styles.bouton} ${styles.boutonInactif}`} aria-disabled="true">
                Fichier bientôt disponible
              </span>
            )}
          </div>
          {r.type === "video" && <Commentaires id={r.id} commentaires={commentaires} moderateur={moderateur} />}
        </>
      )}
      {!debloquee && (
        <Carte>
          <p className="message-info">Ce contenu s&apos;ouvrira en semaine {r.semaine_deblocage}. Du nouveau arrive chaque semaine d&apos;abonnement.</p>
        </Carte>
      )}
      <div style={{ height: 12 }} />
    </>
  );
}
