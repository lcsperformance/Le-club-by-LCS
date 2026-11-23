"use client";

import { useRef, useState, useTransition } from "react";
import { enregistrerNom, enregistrerPrenom } from "@/app/(membre)/profil/actions";
import { Champ } from "@/components/ui";
import { LONGUEUR_MAX_NOM, LONGUEUR_MAX_PRENOM, lireNomSaisi, lirePrenomSaisi } from "@/lib/prenom";

const CHAMPS = {
  prenom: {
    libelle: "Prénom",
    placeholder: "Ton prénom",
    autoComplete: "given-name",
    longueur: LONGUEUR_MAX_PRENOM,
    lire: (v: string) => {
      const lu = lirePrenomSaisi(v);
      return "erreur" in lu ? lu : { valeur: lu.prenom };
    },
    enregistrer: async (v: string) => {
      const r = await enregistrerPrenom(v);
      return { erreur: r.erreur, valeur: r.prenom ?? null };
    },
  },
  nom: {
    libelle: "Nom",
    placeholder: "Ton nom de famille",
    autoComplete: "family-name",
    longueur: LONGUEUR_MAX_NOM,
    lire: (v: string) => {
      const lu = lireNomSaisi(v);
      return "erreur" in lu ? lu : { valeur: lu.nom };
    },
    enregistrer: async (v: string) => {
      const r = await enregistrerNom(v);
      return { erreur: r.erreur, valeur: r.nom ?? null };
    },
  },
} as const;

/** Prénom (ou nom de famille) modifiable dans le Profil, enregistré quand on quitte le champ (ou avec Entrée). */
export function ChampPrenom({ prenom: initial, champ = "prenom" }: { prenom: string | null; champ?: keyof typeof CHAMPS }) {
  const c = CHAMPS[champ];
  const [enregistre, setEnregistre] = useState(initial ?? "");
  const [etat, setEtat] = useState<{ texte: string; erreur: boolean } | null>(null);
  const [, demarrer] = useTransition();
  const saisie = useRef<HTMLInputElement>(null);

  function enregistrer() {
    const valeur = saisie.current?.value ?? "";
    if (valeur.trim() === enregistre) return;
    // Même vérification que le serveur, pour répondre tout de suite.
    const lu = c.lire(valeur);
    if ("erreur" in lu) {
      setEtat({ texte: lu.erreur, erreur: true });
      return;
    }
    setEtat(null);
    demarrer(async () => {
      const r = await c.enregistrer(valeur);
      if (r.erreur) {
        setEtat({ texte: r.erreur, erreur: true });
      } else {
        setEnregistre(r.valeur ?? "");
        if (saisie.current) saisie.current.value = r.valeur ?? "";
        setEtat({ texte: "Enregistré ✓", erreur: false });
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <Champ
        ref={saisie}
        libelle={c.libelle}
        name={champ}
        defaultValue={initial ?? ""}
        autoComplete={c.autoComplete}
        maxLength={c.longueur}
        placeholder={c.placeholder}
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
