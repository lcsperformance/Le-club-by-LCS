import Link from "next/link";
import type { Records } from "@/lib/records";
import { FormulaireRecords } from "./FormulaireRecords";
import styles from "./records.module.css";

/** Mes records (maquette) : retour au Profil, titre, puis le formulaire (tout est facultatif). */
export function EcranRecords({ records }: { records: Records }) {
  return (
    <>
      <Link href="/profil" className={styles.retour}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M15 5l-7 7 7 7" />
        </svg>
        Profil
      </Link>
      <header>
        <h1 className="titre" style={{ fontSize: 24, lineHeight: 1.15 }}>
          Mes records
        </h1>
        <p className={styles.intro}>Renseigne ceux que tu veux. Rien n&apos;est obligatoire.</p>
      </header>
      <FormulaireRecords records={records} />
      <div style={{ height: 12 }} />
    </>
  );
}
