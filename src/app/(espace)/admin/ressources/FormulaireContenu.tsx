"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ } from "@/components/ui";
import { erreurFichier, lireContenu, nouveauChemin, type ChampContenu } from "@/lib/admin/ressources";
import type { ContenuAdmin } from "@/lib/admin/ressources-serveur";
import type { Theme, TypeRessource } from "@/lib/ressources";
import { createClient } from "@/lib/supabase/client";
import { annulerDepot, enregistrerContenu, supprimerContenu } from "./actions";
import styles from "./admin-ressources.module.css";

/**
 * Ajout ou modification d'un contenu : thème, sous-rubrique, titre, type, PDF ou lien YouTube,
 * miniature (vidéo), semaine de déblocage et ordre. Les fichiers sont déposés directement dans le
 * stockage par le navigateur de l'admin (les règles du stockage n'acceptent que l'admin), puis le
 * contenu est enregistré.
 */
export function FormulaireContenu({ themes, contenu, miniatureActuelle = null }: { themes: Theme[]; contenu?: ContenuAdmin; miniatureActuelle?: string | null }) {
  const router = useRouter();
  const [theme, setTheme] = useState(contenu?.theme ?? themes[0]?.cle ?? "");
  const [sousRubrique, setSousRubrique] = useState(contenu?.sous_rubrique ?? themes[0]?.sous_rubriques[0]?.cle ?? "");
  const [titre, setTitre] = useState(contenu?.titre ?? "");
  const [type, setType] = useState<TypeRessource>(contenu?.type ?? "video");
  const [lien, setLien] = useState(contenu?.youtube_id ? `https://youtu.be/${contenu.youtube_id}` : "");
  const [semaine, setSemaine] = useState(String(contenu?.semaine_deblocage ?? 1));
  const [ordre, setOrdre] = useState(String(contenu?.ordre ?? 1));
  const [pdf, setPdf] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [retirerMiniature, setRetirerMiniature] = useState(false);
  const [erreurs, setErreurs] = useState<Partial<Record<ChampContenu | "pdf" | "miniature", string>>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  const sousRubriques = themes.find((t) => t.cle === theme)?.sous_rubriques ?? [];

  function changerTheme(cle: string) {
    setTheme(cle);
    setSousRubrique(themes.find((t) => t.cle === cle)?.sous_rubriques[0]?.cle ?? "");
  }

  function enregistrer(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const saisie = { theme, sous_rubrique: sousRubrique, titre, type, lien, semaine, ordre };
    const lu = lireContenu(saisie, themes);
    const err: typeof erreurs = "erreurs" in lu ? { ...lu.erreurs } : {};
    if (type === "pdf" && pdf) {
      const e = erreurFichier(pdf, "pdf");
      if (e) err.pdf = e;
    }
    if (type === "video" && image) {
      const e = erreurFichier(image, "miniature");
      if (e) err.miniature = e;
    }
    setErreurs(err);
    if (Object.keys(err).length) {
      setMessage("Vérifie les champs en rouge.");
      return;
    }

    demarrer(async () => {
      const supabase = createClient();
      const deposes: { fichier?: string; miniature?: string } = {};
      try {
        if (type === "pdf" && pdf) {
          const chemin = nouveauChemin(theme, "pdf", pdf.type, crypto.randomUUID());
          const { error } = await supabase.storage.from("ressources").upload(chemin, pdf, { contentType: "application/pdf" });
          if (error) throw new Error("Le PDF n'a pas pu être déposé. Réessaie.");
          deposes.fichier = chemin;
        }
        if (type === "video" && image) {
          const chemin = nouveauChemin(theme, "miniature", image.type, crypto.randomUUID());
          const { error } = await supabase.storage.from("miniatures").upload(chemin, image, { contentType: image.type });
          if (error) throw new Error("La miniature n'a pas pu être déposée. Réessaie.");
          deposes.miniature = chemin;
        }
      } catch (ex) {
        await annulerDepot(deposes);
        setMessage((ex as Error).message);
        return;
      }

      const miniature = deposes.miniature ?? (retirerMiniature ? null : undefined);
      const r = await enregistrerContenu(contenu?.id ?? null, saisie, { fichier: deposes.fichier, miniature });
      if (r.erreur || r.erreurs) {
        await annulerDepot(deposes);
        if (r.erreurs) setErreurs(r.erreurs);
        setMessage(r.erreur ?? "Vérifie les champs en rouge.");
        return;
      }
      router.push("/admin/ressources");
      router.refresh();
    });
  }

  function supprimer() {
    if (!contenu) return;
    if (!window.confirm(`Supprimer « ${contenu.titre} » ? Ses favoris, ses commentaires et son fichier seront supprimés aussi.`)) return;
    demarrer(async () => {
      const r = await supprimerContenu(contenu.id);
      if (r.erreur) setMessage(r.erreur);
      else {
        router.push("/admin/ressources");
        router.refresh();
      }
    });
  }

  return (
    <form className={styles.formulaire} onSubmit={enregistrer} noValidate>
      <Carte className={styles.formulaire}>
        <div className={styles.deuxColonnes}>
          <label className={styles.champ}>
            <span className={styles.libelle}>Thème</span>
            <select className={styles.choix} value={theme} onChange={(e) => changerTheme(e.target.value)} aria-invalid={erreurs.theme ? true : undefined}>
              {themes.map((t) => (
                <option key={t.cle} value={t.cle}>
                  {t.nom}
                </option>
              ))}
            </select>
            {erreurs.theme && <span className={styles.erreur}>{erreurs.theme}</span>}
          </label>
          <label className={styles.champ}>
            <span className={styles.libelle}>Sous-rubrique</span>
            <select
              className={styles.choix}
              value={sousRubrique}
              onChange={(e) => setSousRubrique(e.target.value)}
              aria-invalid={erreurs.sous_rubrique ? true : undefined}
            >
              {sousRubriques.map((s) => (
                <option key={s.cle} value={s.cle}>
                  {s.nom}
                </option>
              ))}
            </select>
            {erreurs.sous_rubrique && <span className={styles.erreur}>{erreurs.sous_rubrique}</span>}
            {!sousRubriques.length && <span className={styles.erreur}>Ce thème n&apos;a pas encore de sous-rubrique : ajoute-en une dans « Thèmes et sous-rubriques ».</span>}
          </label>
        </div>
        <Champ libelle="Titre" name="titre" value={titre} maxLength={120} onChange={(e) => setTitre(e.target.value)} erreur={erreurs.titre} />

        <div className={styles.champ}>
          <span className={styles.libelle} id="libelle-type">
            Type de contenu
          </span>
          <div className={styles.types} role="group" aria-labelledby="libelle-type">
            {(["video", "pdf"] as const).map((t) => (
              <button key={t} type="button" className={styles.type} aria-pressed={type === t} onClick={() => setType(t)}>
                {t === "video" ? "Vidéo YouTube" : "PDF"}
              </button>
            ))}
          </div>
        </div>

        {type === "video" ? (
          <>
            <Champ
              libelle="Lien de la vidéo YouTube (non répertoriée)"
              name="lien"
              value={lien}
              placeholder="https://youtu.be/…"
              onChange={(e) => setLien(e.target.value)}
              erreur={erreurs.lien}
              aide="Laisse vide si la vidéo n'est pas encore prête : les membres verront « Vidéo bientôt disponible »."
              inputMode="url"
            />
            <div className={styles.fichier}>
              <span className={styles.libelle}>Miniature (facultative)</span>
              {miniatureActuelle && !retirerMiniature && !image && (
                <>
                  <span className={styles.apercuMiniature} style={{ backgroundImage: `url(${miniatureActuelle})` }} role="img" aria-label="Miniature actuelle" />
                  <button type="button" className={styles.lienDiscret} onClick={() => setRetirerMiniature(true)}>
                    Retirer la miniature
                  </button>
                </>
              )}
              <ChoixFichier libelle="Choisir une miniature" accept="image/jpeg,image/png,image/webp" fichier={image} onChoix={setImage} />
              <span className={styles.aide}>JPG, PNG ou WebP, 2 Mo au plus. Sans miniature, celle de YouTube est utilisée.</span>
              {erreurs.miniature && <span className={styles.erreur}>{erreurs.miniature}</span>}
            </div>
          </>
        ) : (
          <div className={styles.fichier}>
            <span className={styles.libelle}>Fichier PDF</span>
            <span className={styles.fichierActuel}>{contenu?.fichier ? "Un PDF est déjà déposé. Choisis-en un autre pour le remplacer." : "Aucun PDF déposé : les membres verront « Fichier bientôt disponible »."}</span>
            <ChoixFichier libelle="Choisir un PDF" accept="application/pdf" fichier={pdf} onChoix={setPdf} />
            <span className={styles.aide}>50 Mo au plus. Les membres le téléchargent par un lien temporaire, seulement une fois débloqué.</span>
            {erreurs.pdf && <span className={styles.erreur}>{erreurs.pdf}</span>}
          </div>
        )}

        <div className={styles.deuxColonnes}>
          <Champ
            libelle="Semaine de déblocage"
            name="semaine"
            type="number"
            min={1}
            max={520}
            inputMode="numeric"
            value={semaine}
            onChange={(e) => setSemaine(e.target.value)}
            erreur={erreurs.semaine}
            aide="1 = dès l'inscription, 4 = à partir de la 4e semaine d'abonnement."
          />
          <Champ
            libelle="Ordre dans la sous-rubrique"
            name="ordre"
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            value={ordre}
            onChange={(e) => setOrdre(e.target.value)}
            erreur={erreurs.ordre}
          />
        </div>
      </Carte>

      {message && (
        <p role="alert" className="message-erreur">
          {message}
        </p>
      )}
      <div className={styles.actions}>
        <BoutonPrincipal type="submit" enCours={enCours} texteEnCours="Enregistrement…">
          {contenu ? "Enregistrer les modifications" : "Ajouter le contenu"}
        </BoutonPrincipal>
        {contenu && (
          <BoutonSecondaire type="button" onClick={supprimer} disabled={enCours} className={styles.danger}>
            Supprimer ce contenu
          </BoutonSecondaire>
        )}
      </div>
    </form>
  );
}

/** Sélecteur de fichier en français (le bouton natif du navigateur peut s'afficher en anglais). */
function ChoixFichier({ libelle, accept, fichier, onChoix }: { libelle: string; accept: string; fichier: File | null; onChoix: (f: File | null) => void }) {
  return (
    <label className={styles.boutonFichier}>
      <input type="file" accept={accept} aria-label={libelle} className={styles.cache} onChange={(e) => onChoix(e.target.files?.[0] ?? null)} />
      <span aria-hidden>{libelle}</span>
      <span className={styles.nomFichier} aria-live="polite">
        {fichier ? `Choisi : ${fichier.name}` : "Aucun fichier choisi"}
      </span>
    </label>
  );
}
