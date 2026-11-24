"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { supprimerMonCompte } from "@/app/(membre)/profil/compte-actions";
import { BoutonSecondaire, Carte, Champ } from "@/components/ui";
import { PAGES_LEGALES } from "@/lib/legal";
import { confirmationValide, MOT_DE_CONFIRMATION } from "@/lib/mes-donnees";
import styles from "./MesDonnees.module.css";

/**
 * Profil : « Mes données » (télécharger, supprimer le compte) et « Informations légales ».
 * La suppression demande de taper SUPPRIMER ; un compte de l'équipe se retire depuis l'administration.
 */
export function MesDonnees({
  membre,
  abonnementEnCours,
  suppressionOuverte = false,
}: {
  membre: boolean;
  abonnementEnCours: boolean;
  /** Aperçus : panneau de suppression déjà ouvert. */
  suppressionOuverte?: boolean;
}) {
  const [ouvert, setOuvert] = useState(suppressionOuverte);
  const [saisie, setSaisie] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  function supprimer() {
    setErreur(null);
    demarrer(async () => {
      // En cas de succès, le serveur redirige vers la connexion.
      const r = await supprimerMonCompte(saisie);
      if (r?.erreur) setErreur(r.erreur);
    });
  }

  return (
    <>
      <Carte as="section" className={styles.carte} aria-labelledby="titre-mes-donnees">
        <h2 id="titre-mes-donnees" className="titre-carte" style={{ fontSize: 16 }}>
          Mes données
        </h2>
        <p className={styles.aide}>Un fichier avec tout ce que le Club conserve sur toi (sans le programme, qui reste dans l&apos;app).</p>
        <BoutonSecondaire href="/profil/donnees" prefetch={false} download>
          Télécharger mes données
        </BoutonSecondaire>

        {membre &&
          (ouvert ? (
            <div className={styles.danger} role="group" aria-labelledby="titre-suppression">
              <h3 id="titre-suppression" className={styles.dangerTitre}>
                Supprimer mon compte
              </h3>
              <p className={styles.aide}>
                {abonnementEnCours && (
                  <>
                    <strong>Ton abonnement sera résilié tout de suite, sans remboursement de la période en cours.</strong>{" "}
                  </>
                )}
                Ton compte et toutes tes données (tests, zones, saison, records, séances, messages, questions) seront effacés
                définitivement. Tes factures restent chez Stripe, comme la loi l&apos;impose.
              </p>
              <Champ
                libelle={`Tape ${MOT_DE_CONFIRMATION} pour confirmer`}
                name="confirmation"
                autoComplete="off"
                autoCapitalize="characters"
                value={saisie}
                onChange={(e) => setSaisie(e.target.value)}
              />
              {erreur && (
                <p className="message-erreur" role="alert">
                  {erreur}
                </p>
              )}
              <button
                type="button"
                className={styles.boutonDanger}
                disabled={!confirmationValide(saisie) || enCours}
                onClick={supprimer}
              >
                {enCours ? "Suppression…" : "Supprimer définitivement mon compte"}
              </button>
              <button type="button" className={styles.annuler} onClick={() => setOuvert(false)} disabled={enCours}>
                Annuler
              </button>
            </div>
          ) : (
            <button type="button" className={styles.lienDanger} onClick={() => setOuvert(true)}>
              Supprimer mon compte
            </button>
          ))}
      </Carte>

      <Carte as="section" className={styles.carte} aria-labelledby="titre-legal">
        <h2 id="titre-legal" className="titre-carte" style={{ fontSize: 16 }}>
          Informations légales
        </h2>
        <ul className={styles.liens}>
          {PAGES_LEGALES.map((p) => (
            <li key={p.href}>
              <Link href={p.href} className="lien">
                {p.libelle}
              </Link>
            </li>
          ))}
        </ul>
      </Carte>
    </>
  );
}
