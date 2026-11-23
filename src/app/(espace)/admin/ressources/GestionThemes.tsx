"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { IconeTheme } from "@/components/IconeTheme";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ } from "@/components/ui";
import { ICONES_THEMES, type IconeTheme as Icone, type Theme } from "@/lib/ressources";
import {
  enregistrerSousRubrique,
  enregistrerTheme,
  supprimerSousRubrique,
  supprimerTheme,
  type ResultatAdminRessources,
} from "./actions";
import styles from "./admin-ressources.module.css";

const NOMS_ICONES: Record<Icone, string> = {
  nutrition: "Pomme (nutrition)",
  natation: "Vagues (natation)",
  velo: "Vélo",
  course: "Coureur",
  preparation: "Cible (préparation)",
};

type Lancer = (action: () => Promise<ResultatAdminRessources>, confirmation?: string) => void;

/** Thèmes et sous-rubriques : ajouter, renommer, réordonner, changer l'icône, supprimer (seulement vides). */
export function GestionThemes({ themes, contenusParRubrique }: { themes: Theme[]; contenusParRubrique: Record<string, number> }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();

  const lancer: Lancer = (action, confirmation) => {
    if (confirmation && !window.confirm(confirmation)) return;
    setMessage(null);
    demarrer(async () => {
      const r = await action();
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      else {
        setMessage({ texte: "Enregistré ✓", erreur: false });
        router.refresh();
      }
    });
  };

  return (
    <>
      {message && (
        <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : styles.aide}>
          {message.texte}
        </p>
      )}
      {themes.map((t) => (
        <CarteTheme key={t.cle} theme={t} contenusParRubrique={contenusParRubrique} lancer={lancer} enCours={enCours} />
      ))}
      <Carte as="section" aria-labelledby="titre-nouveau-theme" className={styles.formulaire}>
        <h2 id="titre-nouveau-theme" className={styles.themeNom}>
          Nouveau thème
        </h2>
        <FormulaireTheme ordreParDefaut={themes.length + 1} enCours={enCours} onValider={(saisie) => lancer(() => enregistrerTheme(null, saisie))} />
      </Carte>
    </>
  );
}

function FormulaireTheme({
  theme,
  ordreParDefaut = 1,
  enCours,
  onValider,
}: {
  theme?: Theme;
  ordreParDefaut?: number;
  enCours: boolean;
  onValider: (saisie: Record<string, unknown>) => void;
}) {
  const [nom, setNom] = useState(theme?.nom ?? "");
  const [icone, setIcone] = useState<Icone>(theme?.icone ?? "preparation");
  const [ordre, setOrdre] = useState(String(theme?.ordre ?? ordreParDefaut));
  const id = theme?.cle ?? "nouveau";
  return (
    <form
      className={styles.formulaire}
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onValider({ nom, icone, ordre });
        if (!theme) setNom("");
      }}
    >
      <div className={styles.ligneSousRubrique}>
        <Champ libelle="Nom du thème" name={`nom-theme-${id}`} value={nom} maxLength={40} onChange={(e) => setNom(e.target.value)} />
        <div className={styles.ordre}>
          <Champ libelle="Ordre" name={`ordre-theme-${id}`} type="number" min={1} max={99} inputMode="numeric" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
        </div>
      </div>
      <div className={styles.champ}>
        <span className={styles.libelle} id={`icones-${id}`}>
          Icône
        </span>
        <div className={styles.icones} role="group" aria-labelledby={`icones-${id}`}>
          {ICONES_THEMES.map((i) => (
            <button key={i} type="button" className={styles.icone} aria-pressed={icone === i} aria-label={NOMS_ICONES[i]} title={NOMS_ICONES[i]} onClick={() => setIcone(i)}>
              <IconeTheme icone={i} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <BoutonPrincipal type="submit" compact disabled={enCours}>
          {theme ? "Enregistrer le thème" : "Ajouter le thème"}
        </BoutonPrincipal>
      </div>
    </form>
  );
}

function CarteTheme({ theme: t, contenusParRubrique, lancer, enCours }: { theme: Theme; contenusParRubrique: Record<string, number>; lancer: Lancer; enCours: boolean }) {
  const total = t.sous_rubriques.reduce((n, s) => n + (contenusParRubrique[`${t.cle}/${s.cle}`] ?? 0), 0);
  const [nouvelle, setNouvelle] = useState("");
  return (
    <Carte as="section" aria-labelledby={`theme-${t.cle}`} className={styles.formulaire}>
      <div className={styles.themeEntete}>
        <IconeTheme icone={t.icone} className={styles.themeIcone} />
        <h2 id={`theme-${t.cle}`} className={styles.themeNom} style={{ flex: 1 }}>
          {t.nom}
        </h2>
        <span className={styles.aide}>
          {total} contenu{total > 1 ? "s" : ""}
        </span>
      </div>
      <FormulaireTheme theme={t} enCours={enCours} onValider={(saisie) => lancer(() => enregistrerTheme(t.cle, saisie))} />

      <h3 className={styles.sousTitre}>Sous-rubriques</h3>
      {t.sous_rubriques.map((s) => (
        <LigneSousRubrique
          key={s.cle}
          theme={t.cle}
          sousRubrique={s}
          nbContenus={contenusParRubrique[`${t.cle}/${s.cle}`] ?? 0}
          lancer={lancer}
          enCours={enCours}
        />
      ))}
      <form
        className={styles.ligneSousRubrique}
        onSubmit={(e) => {
          e.preventDefault();
          lancer(() => enregistrerSousRubrique(t.cle, null, { nom: nouvelle, ordre: t.sous_rubriques.length + 1 }));
          setNouvelle("");
        }}
      >
        <Champ libelle="Nouvelle sous-rubrique" name={`nouvelle-sous-${t.cle}`} value={nouvelle} maxLength={60} onChange={(e) => setNouvelle(e.target.value)} />
        <BoutonSecondaire type="submit" compact disabled={enCours}>
          Ajouter
        </BoutonSecondaire>
      </form>

      <div>
        <button
          type="button"
          className={`${styles.lienDiscret} ${styles.danger}`}
          disabled={enCours}
          onClick={() =>
            lancer(
              () => supprimerTheme(t.cle),
              total ? undefined : `Supprimer le thème « ${t.nom} » et ses sous-rubriques vides ?`,
            )
          }
        >
          Supprimer ce thème
        </button>
        {total > 0 && <span className={styles.aide}> · impossible tant qu&apos;il contient des contenus</span>}
      </div>
    </Carte>
  );
}

function LigneSousRubrique({
  theme,
  sousRubrique: s,
  nbContenus,
  lancer,
  enCours,
}: {
  theme: string;
  sousRubrique: Theme["sous_rubriques"][number];
  nbContenus: number;
  lancer: Lancer;
  enCours: boolean;
}) {
  const [nom, setNom] = useState(s.nom);
  const [ordre, setOrdre] = useState(String(s.ordre));
  return (
    <form
      className={styles.ligneSousRubrique}
      onSubmit={(e) => {
        e.preventDefault();
        lancer(() => enregistrerSousRubrique(theme, s.cle, { nom, ordre }));
      }}
    >
      <Champ libelle={`Sous-rubrique (${nbContenus} contenu${nbContenus > 1 ? "s" : ""})`} name={`sous-${theme}-${s.cle}`} value={nom} maxLength={60} onChange={(e) => setNom(e.target.value)} />
      <div className={styles.ordre}>
        <Champ libelle="Ordre" name={`ordre-sous-${theme}-${s.cle}`} type="number" min={1} max={99} inputMode="numeric" value={ordre} onChange={(e) => setOrdre(e.target.value)} />
      </div>
      <BoutonSecondaire type="submit" compact disabled={enCours}>
        Enregistrer
      </BoutonSecondaire>
      <button
        type="button"
        className={`${styles.lienDiscret} ${styles.danger}`}
        disabled={enCours}
        onClick={() => lancer(() => supprimerSousRubrique(theme, s.cle), nbContenus ? undefined : `Supprimer la sous-rubrique « ${s.nom} » ?`)}
        style={{ alignSelf: "center" }}
      >
        Supprimer
      </button>
    </form>
  );
}
