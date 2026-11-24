"use client";

import { useEffect, useState } from "react";
import { BoutonSecondaire, Carte } from "@/components/ui";
import { carteNotifications, CLE_CARTE_NOTIF_FERMEE, type CarteNotifications as Affichage } from "@/lib/notifications";
import { activerSurCetAppareil, etatAppareil } from "@/lib/notifications-navigateur";
import styles from "./CarteInstallation.module.css";

/**
 * Carte « Activer les notifications » de l'accueil (donc après la connexion).
 * La fenêtre d'autorisation du téléphone ne s'ouvre qu'au toucher de « Activer » : jamais à l'ouverture de la page.
 * iPhone et iPad : il faut d'abord installer l'app (Apple n'envoie de notifications qu'aux apps installées).
 */
export function CarteNotifications({ apercu }: { apercu?: Exclude<Affichage, null> }) {
  const [affichage, setAffichage] = useState<Affichage>(apercu ?? null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    if (apercu) return;
    let fermee = false;
    try {
      fermee = localStorage.getItem(CLE_CARTE_NOTIF_FERMEE) === "1";
    } catch {
      // Stockage indisponible : la carte reste affichable.
    }
    let actif = true;
    etatAppareil()
      .then((etat) => actif && setAffichage(carteNotifications({ ...etat, fermee })))
      .catch(() => undefined);
    return () => {
      actif = false;
    };
  }, [apercu]);

  if (!affichage) return null;

  function fermer() {
    try {
      localStorage.setItem(CLE_CARTE_NOTIF_FERMEE, "1");
    } catch {
      // Tant pis : la carte reviendra à la prochaine ouverture.
    }
    setAffichage(null);
  }

  async function activer() {
    setErreur(null);
    setEnCours(true);
    const resultat = await activerSurCetAppareil();
    setEnCours(false);
    if (resultat.erreur) setErreur(resultat.erreur);
    else setAffichage(null);
  }

  return (
    <Carte as="section" className={styles.carte} aria-labelledby="titre-notifications">
      <span className={styles.entete}>
        <span className={styles.surtitre}>Notifications</span>
        <button type="button" className={styles.fermer} onClick={fermer} aria-label="Plus tard : ne plus proposer les notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </span>
      <h2 id="titre-notifications" className={`titre-carte ${styles.titre}`}>
        Ne rate ni les annonces ni la FAQ
      </h2>
      {affichage === "activer" ? (
        <>
          <p className={styles.texte}>
            Une notification à chaque annonce du Club, et un rappel la veille de chaque FAQ en visio. Tu pourras changer
            d&apos;avis dans ton Profil.
          </p>
          {erreur && (
            <p className="message-erreur" role="alert">
              {erreur}
            </p>
          )}
          <BoutonSecondaire onClick={activer} enCours={enCours} texteEnCours="Activation…" style={{ minHeight: 46, fontSize: 15 }}>
            Activer les notifications
          </BoutonSecondaire>
        </>
      ) : (
        <p className={styles.texte}>
          Sur iPhone et iPad, les notifications arrivent seulement dans l&apos;app installée : ajoute d&apos;abord Le Club
          sur ton écran d&apos;accueil (Partager, puis « Sur l&apos;écran d&apos;accueil »), puis ouvre-la depuis son icône.
        </p>
      )}
    </Carte>
  );
}
