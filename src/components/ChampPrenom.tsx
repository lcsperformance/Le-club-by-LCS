"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerPrenom } from "@/app/(membre)/profil/actions";
import { Champ } from "@/components/ui";
import { LONGUEUR_MAX_PRENOM, lirePrenomSaisi } from "@/lib/prenom";

/** Prénom modifiable dans le Profil, enregistré quand on quitte le champ (ou avec Entrée). */
export function ChampPrenom({ prenom: initial }: { prenom: string | null }) {
  const [enregistre, setEnregistre] = useState(initial ?? "");
  const [etat, setEtat] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [, demarrer] = useTransition();
  const champ = useRef<HTMLInputElement>(null);

  function enregistrer() {
    const valeur = champ.current?.value ?? "";
    if (valeur.trim() === enregistre) return;
    // Même vérification que le serveur, pour répondre tout de suite.
    const lu = lirePrenomSaisi(valeur);
    if ("erreur" in lu) {
      setEtat({ texte: lu.erreur, erreur: true });
      return;
    }
    setEtat(null);
    demarrer(async () => {
      const r = await enregistrerPrenom(valeur);
      if (r.erreur) {
        setEtat({ texte: r.erreur, erreur: true });
      } else {
        setEnregistre(r.prenom ?? "");
        if (champ.current) champ.current.value = r.prenom ?? "";
        setEtat({ texte: "Enregistré ✓", erreur: false });
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <Champ
        ref={champ}
        libelle="Prénom"
        name="prenom"
        defaultValue={initial ?? ""}
        autoComplete="given-name"
        maxLength={LONGUEUR_MAX_PRENOM}
        placeholder="Ton prénom"
        erreur={etat?.erreur ? etat.texte : undefined}
        onBlur={enregistrer}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />
      {etat && !etat.erreur && (
        <p role="status" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
          {etat.texte}
        </p>
      )}
    </div>
  );
}
