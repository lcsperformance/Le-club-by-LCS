"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Carte, Champ } from "@/components/ui";
import { CHOIX_ROLES, choixDuCompte, comptesAffiches, type ChoixRole, type CompteEquipe } from "@/lib/admin/equipe";
import { changerRole, type ResultatEquipe } from "./actions";
import styles from "./EcranEquipe.module.css";

/** Équipe du Club : coachs et admins ; chercher un membre pour lui donner un rôle. */
export function EcranEquipe({ comptes, moi }: { comptes: CompteEquipe[]; moi: string }) {
  const [recherche, setRecherche] = useState("");
  const affiches = comptesAffiches(comptes, recherche);

  return (
    <>
      <Carte as="section" className={styles.legende} aria-label="Les rôles">
        <ul>
          {CHOIX_ROLES.map((c) => (
            <li key={c.cle}>
              <strong>{c.libelle}</strong> : {c.aide}
            </li>
          ))}
        </ul>
      </Carte>
      <Champ
        libelle="Ajouter quelqu'un à l'équipe"
        name="recherche"
        type="search"
        placeholder="Prénom, nom ou e-mail d'un membre"
        autoComplete="off"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      {affiches.length === 0 ? (
        <p className={styles.vide}>{recherche.trim() ? "Aucun compte ne correspond à ta recherche." : "Personne dans l'équipe pour l'instant."}</p>
      ) : (
        <ul className={styles.liste}>
          {affiches.map((c) => (
            <li key={c.id}>
              <LigneCompte compte={c} estMoi={c.id === moi} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function LigneCompte({ compte: c, estMoi }: { compte: CompteEquipe; estMoi: boolean }) {
  const router = useRouter();
  const [choix, setChoix] = useState<ChoixRole>(choixDuCompte(c));
  const [resultat, setResultat] = useState<ResultatEquipe>({});
  const [enCours, demarrer] = useTransition();
  const nom = [c.prenom, c.nom].filter(Boolean).join(" ") || "Sans prénom";
  const idChoix = `role-${c.id}`;

  function changer(nouveau: ChoixRole) {
    const avant = choix;
    setChoix(nouveau);
    setResultat({});
    demarrer(async () => {
      const r = await changerRole(c.id, nouveau);
      if (r.erreur) setChoix(avant);
      setResultat(r);
      if (!r.erreur) router.refresh();
    });
  }

  return (
    <Carte as="article" className={styles.compte} aria-label={`${nom}, ${c.email}`}>
      <div className={styles.identite}>
        <p className={styles.nom}>
          {nom}
          {estMoi && <span className={styles.moi}> (toi)</span>}
        </p>
        <p className={styles.email}>{c.email}</p>
      </div>
      <label className={styles.choix} htmlFor={idChoix}>
        <span>Rôle</span>
        <select id={idChoix} value={choix} disabled={enCours} onChange={(e) => changer(e.target.value as ChoixRole)}>
          {CHOIX_ROLES.map((r) => (
            <option key={r.cle} value={r.cle} disabled={estMoi && (r.cle === "membre" || r.cle === "coach")}>
              {r.libelle}
            </option>
          ))}
        </select>
      </label>
      {(resultat.erreur || resultat.info) && (
        <p className={resultat.erreur ? "message-erreur" : styles.info} role={resultat.erreur ? "alert" : "status"}>
          {resultat.erreur ?? resultat.info}
        </p>
      )}
    </Carte>
  );
}
