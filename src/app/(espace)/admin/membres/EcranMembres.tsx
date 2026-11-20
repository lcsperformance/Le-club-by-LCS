"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BoutonSecondaire, Carte, Champ } from "@/components/ui";
import {
  anciennete,
  etatAcces,
  filtrerMembres,
  libelleJournal,
  libelleStatut,
  type LigneJournal,
  type MembreAdmin,
  type Ton,
} from "@/lib/admin/membres";
import { formatDateCourteFr, formatHeureFr } from "@/lib/dates";
import { CONFIG_PROFILS } from "@/lib/profils";
import { couperAcces, offrirAcces, renvoyerEmailAcces, type ResultatAdmin } from "./actions";
import styles from "./EcranMembres.module.css";

/** Liste des membres pour l'admin : recherche, statut, niveau, ancienneté et gestion des accès. */
export function EcranMembres({
  membres,
  journal,
  maintenant,
}: {
  membres: MembreAdmin[];
  journal: LigneJournal[];
  /** ISO : même instant côté serveur et navigateur. */
  maintenant: string;
}) {
  const [recherche, setRecherche] = useState("");
  const trouves = filtrerMembres(membres, recherche);
  const instant = new Date(maintenant);

  return (
    <>
      <Champ
        libelle="Rechercher un membre"
        name="recherche"
        type="search"
        placeholder="Prénom ou e-mail"
        autoComplete="off"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
      />
      <p aria-live="polite" style={{ fontSize: 13, color: "var(--texte-doux)" }}>
        {trouves.length} membre{trouves.length > 1 ? "s" : ""}
        {recherche.trim() ? ` sur ${membres.length}` : ""}
      </p>
      {trouves.length === 0 ? (
        <p className={styles.vide}>{membres.length ? "Aucun membre ne correspond à ta recherche." : "Aucun membre pour l'instant."}</p>
      ) : (
        <ul className={styles.liste} style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {trouves.map((m) => (
            <li key={m.id}>
              <FicheMembre membre={m} journal={journal.filter((l) => l.membre_id === m.id)} maintenant={instant} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Pastille({ texte, ton }: { texte: string; ton: Ton }) {
  return <span className={`${styles.pastille} ${styles[ton]}`}>{texte}</span>;
}

function FicheMembre({ membre: m, journal, maintenant }: { membre: MembreAdmin; journal: LigneJournal[]; maintenant: Date }) {
  const [ouverte, setOuverte] = useState(false);
  const statut = libelleStatut(m);
  const acces = etatAcces(m, maintenant);
  const nom = m.prenom ?? "Sans prénom";
  const idGestion = `gestion-${m.id}`;

  return (
    <Carte as="article" className={styles.membre} aria-label={`${nom}, ${m.email}`}>
      <div className={styles.haut}>
        <span className={styles.initiale} aria-hidden>
          {(m.prenom ?? m.email).charAt(0).toUpperCase()}
        </span>
        <div className={styles.identite}>
          <p className={styles.prenom}>{nom}</p>
          <p className={styles.email}>{m.email}</p>
        </div>
      </div>
      <div className={styles.infos}>
        <Pastille {...statut} />
        <Pastille {...acces} />
        <Pastille texte={m.niveau ? CONFIG_PROFILS.niveaux[m.niveau].libelle : "Niveau non choisi"} ton="ferme" />
      </div>
      <p style={{ fontSize: 13, color: "var(--texte-doux)" }}>
        {anciennete(m.date_inscription, maintenant)} · inscrit le {formatDateCourteFr(new Date(m.date_inscription))}
      </p>
      <BoutonSecondaire compact aria-expanded={ouverte} aria-controls={idGestion} onClick={() => setOuverte((o) => !o)}>
        {ouverte ? "Fermer" : "Gérer l'accès"}
      </BoutonSecondaire>
      {ouverte && <Gestion id={idGestion} membre={m} nom={nom} journal={journal} />}
    </Carte>
  );
}

function Gestion({ id, membre: m, nom, journal }: { id: string; membre: MembreAdmin; nom: string; journal: LigneJournal[] }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [resultat, setResultat] = useState<ResultatAdmin>({});
  const [date, setDate] = useState("");

  function agir(question: string | null, action: () => Promise<ResultatAdmin>) {
    if (question && !window.confirm(question)) return;
    setResultat({});
    demarrer(async () => {
      let r: ResultatAdmin;
      try {
        r = await action();
      } catch {
        r = { erreur: "Action impossible pour le moment. Recharge la page et réessaie." };
      }
      setResultat(r);
      if (!r.erreur || r.erreur.startsWith("Accès coupé")) router.refresh();
    });
  }

  return (
    <div id={id} className={styles.gestion}>
      <div className={styles.ligneAction}>
        <Champ
          libelle="Ouvrir l'accès jusqu'au"
          name={`offert-${m.id}`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <BoutonSecondaire
          disabled={!date || enCours}
          onClick={() => agir(null, () => offrirAcces(m.id, date))}
        >
          Ouvrir l&apos;accès
        </BoutonSecondaire>
      </div>
      {m.acces_offert_jusqua && (
        <BoutonSecondaire compact disabled={enCours} onClick={() => agir(`Retirer l'accès offert à ${nom} ?`, () => offrirAcces(m.id, null))}>
          Retirer l&apos;accès offert
        </BoutonSecondaire>
      )}
      {m.acces_coupe ? (
        <BoutonSecondaire compact disabled={enCours} onClick={() => agir(`Rétablir l'accès de ${nom} ?`, () => couperAcces(m.id, false))}>
          Rétablir l&apos;accès
        </BoutonSecondaire>
      ) : (
        <BoutonSecondaire
          compact
          disabled={enCours}
          onClick={() =>
            agir(
              `Couper l'accès de ${nom} ? Son abonnement Stripe sera aussi résilié à la fin de la période payée.`,
              () => couperAcces(m.id, true),
            )
          }
        >
          Couper l&apos;accès
        </BoutonSecondaire>
      )}
      <BoutonSecondaire
        compact
        disabled={enCours}
        onClick={() => agir(`Renvoyer l'e-mail d'accès à ${m.email} ?`, () => renvoyerEmailAcces(m.id))}
      >
        Renvoyer l&apos;e-mail d&apos;accès
      </BoutonSecondaire>
      <p aria-live="polite" className={resultat.erreur ? "message-erreur" : "message-info"} hidden={!resultat.erreur && !resultat.info}>
        {resultat.erreur ?? resultat.info}
      </p>
      <section aria-label={`Journal de ${nom}`} className={styles.journal}>
        <p style={{ fontWeight: 800, color: "var(--texte)" }}>Journal</p>
        {journal.length === 0 ? (
          <p>Aucune action manuelle.</p>
        ) : (
          journal.map((l, i) => (
            <p key={i}>
              {formatDateCourteFr(new Date(l.fait_le))} à {formatHeureFr(new Date(l.fait_le))} · {libelleJournal(l)}
            </p>
          ))
        )}
      </section>
    </div>
  );
}
