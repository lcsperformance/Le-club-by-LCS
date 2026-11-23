"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import styles from "@/app/(espace)/admin/ressources/admin-ressources.module.css";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ } from "@/components/ui";
import { lireEvenement, NOMS_TYPES, TYPES_EVENEMENT, valeursFormulaire, type ChampEvenement, type Evenement } from "@/lib/agenda";
import { enregistrerEvenement, supprimerEvenement } from "./actions";

/** Ajout ou modification d'un événement de l'agenda. Dates et heures saisies à l'heure de Paris. */
export function FormulaireEvenement({ evenement }: { evenement?: Evenement }) {
  const router = useRouter();
  const [v, setV] = useState(() => valeursFormulaire(evenement));
  const [erreurs, setErreurs] = useState<Partial<Record<ChampEvenement, string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const changer = (champ: keyof typeof v) => (valeur: string | boolean) => setV((x) => ({ ...x, [champ]: valeur }));

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const lu = lireEvenement(v);
    if ("erreurs" in lu) {
      setErreurs(lu.erreurs);
      setMessage("Vérifie les champs en rouge.");
      return;
    }
    setErreurs({});
    demarrer(async () => {
      const r = await enregistrerEvenement(evenement?.id ?? null, v);
      if (r.erreurs) setErreurs(r.erreurs);
      if (r.erreur || r.erreurs) {
        setMessage(r.erreur ?? "Vérifie les champs en rouge.");
        return;
      }
      router.push("/admin/agenda");
      router.refresh();
    });
  }

  function supprimer() {
    if (!evenement || !window.confirm(`Supprimer « ${evenement.titre} » de l'agenda ?`)) return;
    demarrer(async () => {
      const r = await supprimerEvenement(evenement.id);
      if (r.erreur) setMessage(r.erreur);
      else {
        router.push("/admin/agenda");
        router.refresh();
      }
    });
  }

  return (
    <form className={styles.formulaire} onSubmit={enregistrer} noValidate>
      <Carte className={styles.formulaire}>
        <Champ libelle="Titre" name="titre" value={v.titre} maxLength={80} onChange={(e) => changer("titre")(e.target.value)} erreur={erreurs.titre} />
        <label className={styles.champ}>
          <span className={styles.libelle}>Type</span>
          <select className={styles.choix} value={v.type} onChange={(e) => changer("type")(e.target.value)} aria-invalid={erreurs.type ? true : undefined}>
            {TYPES_EVENEMENT.map((t) => (
              <option key={t} value={t}>
                {NOMS_TYPES[t]}
              </option>
            ))}
          </select>
          {erreurs.type && <span className={styles.erreur}>{erreurs.type}</span>}
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
          <input type="checkbox" style={{ width: 22, height: 22, accentColor: "var(--accent)" }} checked={v.dates_a_confirmer} onChange={(e) => changer("dates_a_confirmer")(e.target.checked)} />
          <span className={styles.libelle} style={{ color: "var(--texte)", fontSize: 14 }}>
            Dates à confirmer (l&apos;agenda affichera la période)
          </span>
        </label>
        {v.dates_a_confirmer && (
          <Champ
            libelle="Période affichée"
            name="periode"
            value={v.periode}
            maxLength={40}
            placeholder="ex. Printemps 2027"
            onChange={(e) => changer("periode")(e.target.value)}
            erreur={erreurs.periode}
          />
        )}

        <div className={styles.deuxColonnes}>
          <Champ
            libelle={v.dates_a_confirmer ? "Jour approximatif" : "Date de début"}
            name="date_debut"
            type="date"
            value={v.date_debut}
            onChange={(e) => changer("date_debut")(e.target.value)}
            erreur={erreurs.debut}
          />
          {!v.dates_a_confirmer && (
            <Champ libelle="Heure de début (Paris)" name="heure_debut" type="time" value={v.heure_debut} onChange={(e) => changer("heure_debut")(e.target.value)} />
          )}
        </div>
        {!v.dates_a_confirmer && (
          <div className={styles.deuxColonnes}>
            <Champ
              libelle="Date de fin (si plusieurs jours)"
              name="date_fin"
              type="date"
              value={v.date_fin}
              onChange={(e) => changer("date_fin")(e.target.value)}
              erreur={erreurs.fin}
            />
            <Champ libelle="Heure de fin (Paris)" name="heure_fin" type="time" value={v.heure_fin} onChange={(e) => changer("heure_fin")(e.target.value)} />
          </div>
        )}

        <Champ libelle="Lieu (facultatif)" name="lieu" value={v.lieu} maxLength={120} placeholder="ex. En visio" onChange={(e) => changer("lieu")(e.target.value)} erreur={erreurs.lieu} />
        <Champ
          libelle="Lien (facultatif)"
          name="lien"
          value={v.lien}
          inputMode="url"
          placeholder="https://… (visio, inscription)"
          onChange={(e) => changer("lien")(e.target.value)}
          erreur={erreurs.lien}
          aide="Visible par les membres connectés seulement."
        />
        <label className={styles.champ}>
          <span className={styles.libelle}>Description (facultative)</span>
          <textarea
            className={styles.choix}
            style={{ height: 110, padding: 12, resize: "vertical" }}
            value={v.description}
            maxLength={500}
            onChange={(e) => changer("description")(e.target.value)}
            aria-invalid={erreurs.description ? true : undefined}
          />
          {erreurs.description && <span className={styles.erreur}>{erreurs.description}</span>}
        </label>
      </Carte>

      {message && (
        <p role="alert" className="message-erreur">
          {message}
        </p>
      )}
      <div className={styles.actions}>
        <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…">
          {evenement ? "Enregistrer les modifications" : "Ajouter à l'agenda"}
        </BoutonPrincipal>
        {evenement && (
          <BoutonSecondaire type="button" onClick={supprimer} disabled={enCours} className={styles.danger}>
            Supprimer l&apos;événement
          </BoutonSecondaire>
        )}
      </div>
    </form>
  );
}
