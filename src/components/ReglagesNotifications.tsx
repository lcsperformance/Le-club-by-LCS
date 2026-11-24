"use client";

import { useEffect, useState, useTransition } from "react";
import { enregistrerReglage } from "@/app/(membre)/notifications/actions";
import { BoutonSecondaire, Carte } from "@/components/ui";
import { activerSurCetAppareil, desactiverSurCetAppareil, etatAppareil, type EtatAppareil } from "@/lib/notifications-navigateur";
import styles from "./ReglagesNotifications.module.css";

type Reglages = { annonces: boolean; faq: boolean; evenements: boolean };
type Champ = "notif_annonces" | "notif_faq" | "notif_evenements";

/**
 * Profil > Notifications : trois interrupteurs (annonces, rappel FAQ, nouveaux événements), enregistrés dès qu'on les touche,
 * et l'état de cet appareil (activer ou désactiver ici). Aucune demande d'autorisation sans toucher un bouton.
 */
export function ReglagesNotifications({ reglages, apercu }: { reglages: Reglages; apercu?: EtatAppareil }) {
  const [valeurs, setValeurs] = useState(reglages);
  const [appareil, setAppareil] = useState<EtatAppareil | null>(apercu ?? null);
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  useEffect(() => {
    if (apercu) return;
    etatAppareil().then(setAppareil).catch(() => undefined);
  }, [apercu]);

  function basculer(champ: Champ, cle: keyof Reglages) {
    const avant = valeurs[cle];
    setValeurs((v) => ({ ...v, [cle]: !avant }));
    setMessage(null);
    demarrer(async () => {
      const r = await enregistrerReglage(champ, !avant);
      if (r.erreur) {
        setValeurs((v) => ({ ...v, [cle]: avant }));
        setMessage({ texte: r.erreur, erreur: true });
      } else setMessage({ texte: "Enregistré ✓", erreur: false });
    });
  }

  function surCetAppareil(activer: boolean) {
    setMessage(null);
    demarrer(async () => {
      const r = activer ? await activerSurCetAppareil() : await desactiverSurCetAppareil();
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      setAppareil(await etatAppareil().catch(() => appareil));
    });
  }

  return (
    <Carte as="section" style={{ display: "grid", gap: 12 }} aria-labelledby="titre-notifications-profil">
      <h2 id="titre-notifications-profil" className="titre-carte" style={{ fontSize: 16 }}>
        Notifications
      </h2>

      <Interrupteur libelle="Annonces du Club" aide="À chaque annonce de Martin ou de l'équipe." actif={valeurs.annonces} onChange={() => basculer("notif_annonces", "annonces")} />
      <Interrupteur libelle="Rappel des FAQ en visio" aide="La veille au soir de chaque FAQ." actif={valeurs.faq} onChange={() => basculer("notif_faq", "faq")} />
      <Interrupteur
        libelle="Nouveaux événements"
        aide="Webinaire, stage… ajouté à l'agenda, ou date modifiée."
        actif={valeurs.evenements}
        onChange={() => basculer("notif_evenements", "evenements")}
      />

      <p className={styles.appareil}>{texteAppareil(appareil)}</p>
      {appareil?.priseEnCharge && appareil.permission !== "denied" && !(appareil.apple && !appareil.installee) && (
        <BoutonSecondaire onClick={() => surCetAppareil(!appareil.abonne)} enCours={enCours} texteEnCours="Un instant…">
          {appareil.abonne ? "Désactiver sur cet appareil" : "Activer sur cet appareil"}
        </BoutonSecondaire>
      )}

      {message && (
        <p className={message.erreur ? "message-erreur" : styles.etat} role={message.erreur ? "alert" : "status"}>
          {message.texte}
        </p>
      )}
    </Carte>
  );
}

function texteAppareil(a: EtatAppareil | null): string {
  if (!a) return "";
  if (a.apple && !a.installee) return "Sur iPhone et iPad, installe d'abord l'app sur ton écran d'accueil pour recevoir les notifications.";
  if (!a.priseEnCharge) return "Cet appareil ou ce navigateur ne reçoit pas les notifications.";
  if (a.permission === "denied") return "Notifications bloquées sur cet appareil : autorise-les dans les réglages du téléphone.";
  return a.abonne ? "Activées sur cet appareil." : "Pas encore activées sur cet appareil.";
}

function Interrupteur({ libelle, aide, actif, onChange }: { libelle: string; aide: string; actif: boolean; onChange: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={actif} className={styles.ligne} onClick={onChange}>
      <span className={styles.textes}>
        <span className={styles.libelle}>{libelle}</span>
        <span className={styles.aide}>{aide}</span>
      </span>
      <span className={styles.interrupteur} aria-hidden>
        <span className={styles.pastille} />
      </span>
    </button>
  );
}
