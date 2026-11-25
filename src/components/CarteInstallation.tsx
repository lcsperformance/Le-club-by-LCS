"use client";

import { useEffect, useState } from "react";
import { BoutonPrincipal, Carte, SurOrdinateur, SurTelephone } from "@/components/ui";
import {
  carteInstallation,
  CLE_CARTE_FERMEE,
  estAppareilApple,
  type CarteInstallation as Affichage,
} from "@/lib/installation";
import styles from "./CarteInstallation.module.css";

/** Invitation à installer, donnée par Chrome sur Android (pas encore dans les types du navigateur). */
type Invitation = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

type Props = {
  /** Aperçus seulement : force l'affichage Android ou iPhone. */
  apercu?: Exclude<Affichage, null>;
};

/**
 * Carte « Installer l'app » de l'accueil : bouton « Installer » sur Android, les deux gestes de Safari
 * sur iPhone. Rien si l'app est déjà installée, si le membre a fermé la carte, ou sur ordinateur.
 */
export function CarteInstallation({ apercu }: Props) {
  const [affichage, setAffichage] = useState<Affichage>(apercu ?? null);
  const [invitation, setInvitation] = useState<Invitation | null>(null);

  useEffect(() => {
    if (apercu) return;
    const installee =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let fermee = false;
    try {
      fermee = localStorage.getItem(CLE_CARTE_FERMEE) === "1";
    } catch {
      // Stockage indisponible (navigation privée) : la carte reste affichable.
    }
    const apple = estAppareilApple(navigator.userAgent, navigator.maxTouchPoints);
    const calculer = (inv: boolean) => setAffichage(carteInstallation({ installee, fermee, apple, invitation: inv }));
    calculer(false);

    const surInvitation = (e: Event) => {
      e.preventDefault();
      setInvitation(e as Invitation);
      calculer(true);
    };
    const surInstallation = () => setAffichage(null);
    window.addEventListener("beforeinstallprompt", surInvitation);
    window.addEventListener("appinstalled", surInstallation);
    return () => {
      window.removeEventListener("beforeinstallprompt", surInvitation);
      window.removeEventListener("appinstalled", surInstallation);
    };
  }, [apercu]);

  if (!affichage) return null;

  function fermer() {
    try {
      localStorage.setItem(CLE_CARTE_FERMEE, "1");
    } catch {
      // Tant pis : la carte reviendra à la prochaine ouverture.
    }
    setAffichage(null);
  }

  async function installer() {
    if (!invitation) return;
    await invitation.prompt();
    const { outcome } = await invitation.userChoice;
    setInvitation(null);
    if (outcome === "accepted") setAffichage(null);
  }

  return (
    <Carte as="section" className={styles.carte} aria-labelledby="titre-installation">
      <span className={styles.entete}>
        <span className={styles.surtitre}>Application</span>
        <button type="button" className={styles.fermer} onClick={fermer} aria-label="Fermer : ne plus proposer l'installation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </span>
      <h2 id="titre-installation" className={`titre-carte ${styles.titre}`}>
        Installe Le Club sur ton{" "}
        <SurTelephone enLigne>téléphone</SurTelephone>
        <SurOrdinateur enLigne>ordinateur</SurOrdinateur>
      </h2>
      {affichage === "android" ? (
        <>
          <p className={styles.texte}>
            <SurTelephone enLigne>Une icône sur ton écran d&apos;accueil, et l&apos;app s&apos;ouvre en plein écran.</SurTelephone>
            <SurOrdinateur enLigne>Une icône dans ton dock ou ton menu, et l&apos;app s&apos;ouvre dans sa propre fenêtre.</SurOrdinateur>
          </p>
          <BoutonPrincipal onClick={installer} style={{ minHeight: 46, fontSize: 15 }}>
            Installer
          </BoutonPrincipal>
        </>
      ) : (
        <ol className={styles.etapes}>
          <li>
            <span className={styles.numero} aria-hidden>
              1
            </span>
            <span>
              Touche{" "}
              <svg className={styles.icone} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12M8 7l4-4 4 4" />
                <path d="M6 11H5v10h14V11h-1" />
              </svg>{" "}
              <strong>Partager</strong> dans la barre de Safari.
            </span>
          </li>
          <li>
            <span className={styles.numero} aria-hidden>
              2
            </span>
            <span>
              Choisis <strong>Sur l&apos;écran d&apos;accueil</strong>, puis <strong>Ajouter</strong>.
            </span>
          </li>
        </ol>
      )}
    </Carte>
  );
}
