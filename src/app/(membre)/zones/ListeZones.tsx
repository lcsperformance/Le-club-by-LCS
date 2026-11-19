"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BoutonSecondaire, Carte, Compteur, PastilleZone } from "@/components/ui";
import type { Bornes } from "@/lib/config-zones";
import { calculerZones, CONFIG_ZONES, SPORTS, type Sport, type Tests } from "@/lib/zones";
import { limitesDebut, memesBornes, type Zone } from "@/lib/zones-perso";
import { enregistrerZones } from "./actions";
import styles from "./zones.module.css";

type Props = {
  sport: Sport;
  test: Tests;
  /** Bornes personnalisées enregistrées pour ce sport, ou null (valeurs du Club). */
  bornesEnregistrees: Bornes | null;
  /** Ouvre directement le mode personnalisation (aperçus de test). */
  personnalisationOuverte?: boolean;
};

/** Les 5 zones d'un sport, avec le mode « Personnaliser mes zones » de la maquette. */
export function ListeZones({ sport, test, bornesEnregistrees, personnalisationOuverte = false }: Props) {
  const router = useRouter();
  const club = CONFIG_ZONES[sport];
  const [bornes, setBornes] = useState<Bornes>(bornesEnregistrees ?? club);
  const [edition, setEdition] = useState(personnalisationOuverte);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const zones = calculerZones(sport, test, CONFIG_ZONES, bornes);
  const personnalisees = !memesBornes(bornes, club);
  const libelleSport = SPORTS.find((s) => s.cle === sport)!.libelle;

  function changerDebut(zone: Zone, valeur: number) {
    setBornes((b) => {
      const copie = [...b] as Bornes;
      copie[zone - 1] = valeur;
      return copie;
    });
  }

  function terminer() {
    setErreur(null);
    if (memesBornes(bornes, bornesEnregistrees ?? club)) {
      setEdition(false);
      return;
    }
    demarrer(async () => {
      const resultat = await enregistrerZones(sport, bornes);
      if (resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      setEdition(false);
      router.refresh();
    });
  }

  return (
    <>
      {personnalisees && <span className={styles.pastillePerso}>Zones personnalisées</span>}

      <section aria-label={`Zones ${libelleSport}`} style={{ display: "grid", gap: 10 }}>
        {zones.map((z) => {
          const { min, max } = limitesDebut(bornes, z.zone);
          return (
            <Carte key={z.zone} className={styles.zone}>
              <PastilleZone zone={z.zone} />
              <div className={styles.infos}>
                <h2 className={`titre-carte ${styles.nom}`}>{z.nom}</h2>
                <p className={styles.detail}>{z.pourcentages}</p>
              </div>
              <div className={styles.valeurs}>
                <p className={styles.cible}>{z.cible ?? "—"}</p>
                {z.frequenceCardiaque && <p className={styles.fc}>{z.frequenceCardiaque}</p>}
              </div>
              {edition && (
                <div className={styles.reglage}>
                  <Compteur
                    valeur={bornes[z.zone - 1]}
                    onChange={(v) => changerDebut(z.zone, v)}
                    pas={1}
                    min={min}
                    max={max}
                    afficher={(v) => `Début de zone : ${v} %`}
                    libelleMoins={`Début de Z${z.zone} moins 1 pour cent`}
                    libellePlus={`Début de Z${z.zone} plus 1 pour cent`}
                    intitule={`Début de la zone ${z.zone}`}
                  />
                </div>
              )}
            </Carte>
          );
        })}
      </section>

      {erreur && (
        <p className="message-erreur" role="alert">
          {erreur}
        </p>
      )}

      {edition ? (
        <>
          <BoutonSecondaire onClick={terminer} enCours={enCours} texteEnCours="Enregistrement…">
            Terminer
          </BoutonSecondaire>
          <button type="button" className={styles.retourClub} onClick={() => setBornes(club)} disabled={!personnalisees}>
            Revenir aux valeurs du Club
          </button>
        </>
      ) : (
        <BoutonSecondaire onClick={() => setEdition(true)}>Personnaliser mes zones</BoutonSecondaire>
      )}
    </>
  );
}
