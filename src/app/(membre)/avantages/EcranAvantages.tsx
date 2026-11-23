import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { formatRemise, initialePartenaire, trierPartenaires, type Partenaire } from "@/lib/partenaires";
import styles from "./avantages.module.css";
import { BoutonCopier } from "./BoutonCopier";

/** Avantages (maquette) : une carte par partenaire, avec sa remise, son code et « Copier le code ». */
export function EcranAvantages({ utilisateur, partenaires }: { utilisateur: Utilisateur; partenaires: Partenaire[] }) {
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Avantages" />
      <p className={styles.intro} style={{ marginTop: -8 }}>
        Les remises réservées aux membres du Club.
      </p>
      <ul className={styles.partenaires}>
        {trierPartenaires(partenaires).map((p) => (
          <Carte as="li" key={p.id} className={styles.partenaire} aria-label={p.nom}>
            <div className={styles.entete}>
              <span className={styles.initiale} aria-hidden>
                {initialePartenaire(p.nom)}
              </span>
              <span className={styles.texte}>
                <span className={styles.nom} style={{ display: "block" }}>
                  {p.nom}
                </span>
                <span className={styles.description} style={{ display: "block" }}>
                  {p.description}
                </span>
              </span>
              <span className={styles.remise}>{formatRemise(p.remise)}</span>
            </div>
            <p className={styles.code} aria-label={`Code ${p.nom} : ${p.code}`}>
              {p.code}
            </p>
            <BoutonCopier code={p.code} partenaire={p.nom} />
            {p.lien && (
              <a href={p.lien} className={`lien ${styles.site}`} target="_blank" rel="noopener noreferrer">
                Aller sur le site {p.nom}
              </a>
            )}
          </Carte>
        ))}
      </ul>
      <p className={styles.bientot}>D&apos;autres partenaires arrivent bientôt. Entre le code au moment du paiement sur le site du partenaire.</p>
      <div style={{ height: 8 }} />
    </>
  );
}
