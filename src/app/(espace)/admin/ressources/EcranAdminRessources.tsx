import Link from "next/link";
import { IconeTheme } from "@/components/IconeTheme";
import { BoutonPrincipal, BoutonSecondaire, Carte } from "@/components/ui";
import { resumeContenu } from "@/lib/admin/ressources";
import type { ContenuAdmin } from "@/lib/admin/ressources-serveur";
import type { Theme } from "@/lib/ressources";
import styles from "./admin-ressources.module.css";

export function RetourAdmin({ href = "/admin", libelle = "Administration" }: { href?: string; libelle?: string }) {
  return (
    <Link href={href} className={styles.retour}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {libelle}
    </Link>
  );
}

/** Ressources côté admin : tous les contenus, par thème et sous-rubrique, avec ce qu'il manque. */
export function EcranAdminRessources({ themes, contenus, nbCommentaires }: { themes: Theme[]; contenus: ContenuAdmin[]; nbCommentaires: number }) {
  const parOrdre = (a: ContenuAdmin, b: ContenuAdmin) => a.ordre - b.ordre || a.titre.localeCompare(b.titre, "fr");
  return (
    <>
      <RetourAdmin />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Ressources
        </h1>
        <p className={styles.aide} style={{ marginTop: 6 }}>
          {contenus.length} contenu{contenus.length > 1 ? "s" : ""} · chaque contenu s&apos;ouvre au membre à sa semaine de déblocage.
        </p>
      </header>
      <div className={styles.actions}>
        <BoutonPrincipal href="/admin/ressources/nouveau" compact>
          Ajouter un contenu
        </BoutonPrincipal>
        <BoutonSecondaire href="/admin/ressources/themes" compact>
          Thèmes et sous-rubriques
        </BoutonSecondaire>
        <BoutonSecondaire href="/admin/ressources/commentaires" compact>
          Commentaires ({nbCommentaires})
        </BoutonSecondaire>
      </div>

      {themes.map((t) => {
        const duTheme = contenus.filter((c) => c.theme === t.cle);
        return (
          <section key={t.cle} className={styles.theme} aria-labelledby={`theme-${t.cle}`}>
            <div className={styles.themeEntete}>
              <IconeTheme icone={t.icone} className={styles.themeIcone} />
              <h2 id={`theme-${t.cle}`} className={styles.themeNom}>
                {t.nom}
              </h2>
            </div>
            {!duTheme.length && <p className={styles.vide}>Aucun contenu dans ce thème.</p>}
            {t.sous_rubriques.map((s) => {
              const liste = duTheme.filter((c) => c.sous_rubrique === s.cle).sort(parOrdre);
              if (!liste.length) return null;
              return (
                <div key={s.cle} style={{ display: "grid", gap: 8 }}>
                  <h3 className={styles.sousTitre}>{s.nom}</h3>
                  <ul className={styles.liste}>
                    {liste.map((c) => {
                      const { texte, manque } = resumeContenu(c);
                      return (
                        <li key={c.id}>
                          <Carte href={`/admin/ressources/${c.id}`} className={styles.ligne}>
                            <span className={styles.ligneTexte}>
                              <span className={styles.ligneTitre}>{c.titre}</span>
                              <span className={styles.ligneMeta}>
                                {texte}
                                {manque && <span className={styles.manque}> · {manque}</span>}
                              </span>
                            </span>
                            <span aria-hidden>Modifier →</span>
                          </Carte>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </section>
        );
      })}
    </>
  );
}
