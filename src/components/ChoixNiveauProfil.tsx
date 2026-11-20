"use client";

import { useState, useTransition, type ReactNode } from "react";
import { enregistrerChoix } from "@/app/(membre)/profil/actions";
import { Carte } from "@/components/ui";
import { CONFIG_PROFILS, NIVEAUX, PROFILS, type Niveau, type Profil } from "@/lib/profils";
import styles from "./ChoixNiveauProfil.module.css";

type Props = {
  niveau: Niveau | null;
  profil: Profil | null;
  /** « zones » : « Ton niveau » (après le calcul des zones) ; « profil » : « Mon niveau » (écran Profil). */
  ecran: "zones" | "profil";
  /** Contenu placé entre la carte du niveau et celle du profil (Profil : lien « Ma saison », comme la maquette). */
  entreLesDeux?: ReactNode;
};

type Etat = { champ: "niveau" | "profil"; texte: string; erreur: boolean } | null;

/** Choix du niveau et du profil par le membre, enregistrés dès qu'il touche une option. */
export function ChoixNiveauProfil({ niveau: niveauInitial, profil: profilInitial, ecran, entreLesDeux }: Props) {
  const [niveau, setNiveau] = useState(niveauInitial);
  const [profil, setProfil] = useState(profilInitial);
  const [etat, setEtat] = useState<Etat>(null);
  const [, demarrer] = useTransition();
  const ton = ecran === "zones" ? "Ton" : "Mon";

  function choisir<T extends string>(champ: "niveau" | "profil", valeur: T, precedente: T | null, appliquer: (v: T | null) => void) {
    if (valeur === precedente) return;
    appliquer(valeur); // affichage immédiat
    setEtat(null);
    demarrer(async () => {
      const resultat = await enregistrerChoix(champ, valeur);
      if (resultat.erreur) {
        appliquer(precedente); // on revient au choix enregistré
        setEtat({ champ, texte: resultat.erreur, erreur: true });
      } else {
        setEtat({ champ, texte: "Enregistré ✓", erreur: false });
      }
    });
  }

  const message = (champ: "niveau" | "profil") =>
    etat?.champ === champ ? (
      <p className={etat.erreur ? "message-erreur" : styles.etat} role={etat.erreur ? "alert" : "status"}>
        {etat.texte}
      </p>
    ) : null;

  return (
    <>
      <Carte as="section" style={{ display: "grid", gap: 10 }} aria-labelledby={`titre-niveau-${ecran}`}>
        <h2 id={`titre-niveau-${ecran}`} className="titre-carte" style={{ fontSize: 16 }}>
          {ton} niveau
        </h2>
        {ecran === "profil" && <p className={styles.aide}>Chaque plan existe en trois niveaux.</p>}
        <div className={styles.niveaux} role="group" aria-label={`${ton} niveau`}>
          {NIVEAUX.map((n) => (
            <button
              key={n}
              type="button"
              className={styles.niveau}
              aria-pressed={niveau === n}
              onClick={() => choisir("niveau", n, niveau, setNiveau)}
            >
              {CONFIG_PROFILS.niveaux[n].libelle}
            </button>
          ))}
        </div>
        {message("niveau")}
      </Carte>

      {entreLesDeux}

      <Carte as="section" style={{ display: "grid", gap: 10 }} aria-labelledby={`titre-profil-${ecran}`}>
        <h2 id={`titre-profil-${ecran}`} className="titre-carte" style={{ fontSize: 16 }}>
          {ton} profil
        </h2>
        <p className={styles.aide}>Choisis celui qui te ressemble le plus.</p>
        <div className={styles.profils} role="group" aria-label={`${ton} profil`}>
          {PROFILS.map((p) => (
            <button
              key={p}
              type="button"
              className={styles.profil}
              aria-pressed={profil === p}
              onClick={() => choisir("profil", p, profil, setProfil)}
            >
              <span className={styles.profilNom}>{CONFIG_PROFILS.profils[p].libelle}</span>
              <span className={styles.profilTexte}>{CONFIG_PROFILS.profils[p].description}</span>
            </button>
          ))}
        </div>
        {message("profil")}
      </Carte>
    </>
  );
}
