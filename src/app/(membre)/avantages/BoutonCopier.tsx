"use client";

import { useEffect, useState } from "react";
import styles from "./avantages.module.css";

/** « Copier le code » → « Code copié ✓ » (et un message si l'appareil refuse la copie). */
export function BoutonCopier({ code, partenaire }: { code: string; partenaire: string }) {
  const [etat, setEtat] = useState<"attente" | "copie" | "echec">("attente");

  useEffect(() => {
    if (etat !== "copie") return;
    const t = setTimeout(() => setEtat("attente"), 3000);
    return () => clearTimeout(t);
  }, [etat]);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
      setEtat("copie");
    } catch {
      setEtat("echec");
    }
  }

  return (
    <>
      <button type="button" className={styles.copier} data-copie={etat === "copie"} onClick={copier} aria-label={`Copier le code ${partenaire}`}>
        {etat === "copie" ? "Code copié ✓" : "Copier le code"}
      </button>
      {etat === "echec" && (
        <p role="alert" className="message-erreur">
          Copie impossible sur cet appareil : appuie longuement sur le code pour le sélectionner.
        </p>
      )}
    </>
  );
}
