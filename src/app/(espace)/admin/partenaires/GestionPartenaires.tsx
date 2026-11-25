"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { RetourAdmin } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import styles from "@/app/(espace)/admin/ressources/admin-ressources.module.css";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ, GrilleCartes } from "@/components/ui";
import { formatRemise, lirePartenaire, trierPartenaires, type ChampPartenaire, type Partenaire } from "@/lib/partenaires";
import { enregistrerPartenaire, supprimerPartenaire } from "./actions";

/** Avantages côté admin : une carte modifiable par partenaire, puis « Ajouter un partenaire ». */
export function GestionPartenaires({ partenaires }: { partenaires: Partenaire[] }) {
  return (
    <>
      <RetourAdmin />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Partenaires
        </h1>
        <p className={styles.aide} style={{ marginTop: 6 }}>
          Les remises de l&apos;onglet Avantages. Les codes ne sont visibles que par les membres connectés.
        </p>
      </header>
      {/* Sur ordinateur : deux partenaires par ligne. */}
      <GrilleCartes>
        {trierPartenaires(partenaires).map((p) => (
          <FormulairePartenaire key={p.id} partenaire={p} />
        ))}
        <FormulairePartenaire ordreParDefaut={partenaires.length + 1} />
      </GrilleCartes>
    </>
  );
}

function FormulairePartenaire({ partenaire: p, ordreParDefaut = 1 }: { partenaire?: Partenaire; ordreParDefaut?: number }) {
  const router = useRouter();
  const vide = { nom: "", remise: "", description: "", code: "", lien: "", ordre: String(ordreParDefaut), affiche: true };
  const [v, setV] = useState(
    p ? { nom: p.nom, remise: String(p.remise), description: p.description, code: p.code, lien: p.lien ?? "", ordre: String(p.ordre), affiche: p.affiche } : vide,
  );
  const [erreurs, setErreurs] = useState<Partial<Record<ChampPartenaire, string>>>({});
  const [message, setMessage] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [enCours, demarrer] = useTransition();
  const id = p?.id ?? "nouveau";
  const changer = (champ: keyof typeof v) => (valeur: string | boolean) => {
    setV((x) => ({ ...x, [champ]: valeur }));
    setMessage(null);
  };

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    const lu = lirePartenaire(v);
    if ("erreurs" in lu) {
      setErreurs(lu.erreurs);
      setMessage({ texte: "Vérifie les champs en rouge.", erreur: true });
      return;
    }
    setErreurs({});
    demarrer(async () => {
      const r = await enregistrerPartenaire(p?.id ?? null, v);
      if (r.erreurs) setErreurs(r.erreurs);
      if (r.erreur || r.erreurs) setMessage({ texte: r.erreur ?? "Vérifie les champs en rouge.", erreur: true });
      else {
        setMessage({ texte: p ? "Enregistré ✓" : "Partenaire ajouté ✓", erreur: false });
        if (!p) setV(vide);
        router.refresh();
      }
    });
  }

  function supprimer() {
    if (!p || !window.confirm(`Supprimer le partenaire « ${p.nom} » ? Son code disparaîtra des Avantages.`)) return;
    demarrer(async () => {
      const r = await supprimerPartenaire(p.id);
      if (r.erreur) setMessage({ texte: r.erreur, erreur: true });
      else router.refresh();
    });
  }

  return (
    <Carte as="section" aria-labelledby={`titre-${id}`}>
      <form className={styles.formulaire} onSubmit={enregistrer} noValidate>
        <div className={styles.themeEntete}>
          <h2 id={`titre-${id}`} className={styles.themeNom} style={{ flex: 1 }}>
            {p ? `${p.nom} · ${formatRemise(p.remise)}` : "Ajouter un partenaire"}
          </h2>
          {p && !p.affiche && <span className={styles.aide}>Masqué aux membres</span>}
        </div>
        {p?.exemple && <p className={styles.manque}>Code d&apos;exemple à remplacer par le vrai code du partenaire.</p>}
        <div className={styles.deuxColonnes}>
          <Champ libelle="Nom" name={`nom-${id}`} value={v.nom} maxLength={40} onChange={(e) => changer("nom")(e.target.value)} erreur={erreurs.nom} />
          <Champ
            libelle="Remise (en %)"
            name={`remise-${id}`}
            type="number"
            min={1}
            max={90}
            inputMode="numeric"
            value={v.remise}
            onChange={(e) => changer("remise")(e.target.value)}
            erreur={erreurs.remise}
          />
        </div>
        <Champ
          libelle="Description"
          name={`description-${id}`}
          value={v.description}
          maxLength={80}
          placeholder="ex. sur les produits Pyrène"
          onChange={(e) => changer("description")(e.target.value)}
          erreur={erreurs.description}
        />
        <div className={styles.deuxColonnes}>
          <Champ libelle="Code promo" name={`code-${id}`} value={v.code} maxLength={30} onChange={(e) => changer("code")(e.target.value)} erreur={erreurs.code} />
          <Champ
            libelle="Ordre"
            name={`ordre-${id}`}
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            value={v.ordre}
            onChange={(e) => changer("ordre")(e.target.value)}
            erreur={erreurs.ordre}
          />
        </div>
        <Champ
          libelle="Site du partenaire (facultatif)"
          name={`lien-${id}`}
          value={v.lien}
          inputMode="url"
          placeholder="https://…"
          onChange={(e) => changer("lien")(e.target.value)}
          erreur={erreurs.lien}
        />
        <label style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, cursor: "pointer" }}>
          <input
            type="checkbox"
            style={{ width: 22, height: 22, accentColor: "var(--accent)" }}
            checked={v.affiche}
            onChange={(e) => changer("affiche")(e.target.checked)}
          />
          <span className={styles.libelle} style={{ color: "var(--texte)", fontSize: 14 }}>
            Affiché aux membres
          </span>
        </label>
        {message && (
          <p role={message.erreur ? "alert" : "status"} className={message.erreur ? "message-erreur" : styles.aide}>
            {message.texte}
          </p>
        )}
        <div className={styles.actions}>
          <BoutonPrincipal type="submit" compact enCours={enCours} texteEnCours="Enregistrement…">
            {p ? "Enregistrer" : "Ajouter le partenaire"}
          </BoutonPrincipal>
          {p && (
            <BoutonSecondaire type="button" compact onClick={supprimer} disabled={enCours} className={styles.danger}>
              Supprimer
            </BoutonSecondaire>
          )}
        </div>
      </form>
    </Carte>
  );
}
