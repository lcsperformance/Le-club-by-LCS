"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Carte } from "@/components/ui";
import { barreVisible, cheminAffiche, ONGLETS, ongletActif, profilActif } from "@/lib/onglets";
import { IconeOnglet } from "./IconeOnglet";
import styles from "./MenuLateral.module.css";
import { SymboleClub } from "./SymboleClub";

/**
 * Menu latéral fixe de l'espace membre sur ordinateur (à partir de 1100 px) : logo, les 5 onglets
 * et « Mon profil ». Masqué sur téléphone et iPad (la barre d'onglets du bas y reste) et,
 * comme la barre, sur les écrans plein écran (tests, abonnement).
 */
export function MenuLateral() {
  const chemin = cheminAffiche(usePathname());
  if (!barreVisible(chemin)) return null;
  const actif = ongletActif(chemin);
  const surProfil = profilActif(chemin);

  return (
    <Carte as="nav" className={styles.menu} aria-label="Navigation principale">
      <Link href="/accueil" className={styles.marque} aria-label="Le Club, accueil">
        <SymboleClub hauteur={34} />
        <span className={`logo ${styles.nom}`}>le club</span>
      </Link>
      <ul className={styles.liste}>
        {ONGLETS.map((o) => (
          <li key={o.cle}>
            <Lien href={o.chemin} cle={o.cle} libelle={o.libelle} actif={o.cle === actif} />
          </li>
        ))}
      </ul>
      <div className={styles.bas}>
        <Lien href="/profil" cle="profil" libelle="Mon profil" actif={surProfil} />
      </div>
    </Carte>
  );
}

function Lien({ href, cle, libelle, actif }: { href: string; cle: Parameters<typeof IconeOnglet>[0]["cle"]; libelle: string; actif: boolean }) {
  return (
    <Link href={href} className={`${styles.lien} ${actif ? styles.actif : ""}`} aria-current={actif ? "page" : undefined}>
      <span className={styles.icone}>
        <IconeOnglet cle={cle} />
      </span>
      {libelle}
    </Link>
  );
}
