/**
 * Tests de départ : les 4 mesures de la maquette (repris de maquette/Main-neon.dc.html),
 * plus la puissance max sur 5 min (facultative, sert à suggérer un profil), avec valeurs par défaut, pas et limites.
 * Les allures sont stockées en secondes (par km ou par 100 m).
 */

/** 270 → « 4:30 ». */
export function formatMinSec(secondes: number): string {
  const s = Math.round(secondes);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export type CleMesure = "allure_seuil_course" | "ftp" | "pma_5min" | "vitesse_critique_natation" | "fc_seuil";

export type Mesure = {
  cle: CleMesure;
  sport: string;
  intitule: string;
  defaut: number;
  pas: number;
  min: number;
  max: number;
  /** Valeur affichée, unité comprise. */
  afficher: (v: number) => string;
  /** Libellés accessibles des boutons − et +. */
  libelleMoins: string;
  libellePlus: string;
  /** Mesure que le membre peut ne pas faire (enregistrée vide). */
  facultative?: boolean;
};

export const MESURES: readonly Mesure[] = [
  {
    cle: "allure_seuil_course",
    sport: "Course à pied",
    intitule: "Allure de seuil",
    defaut: 270,
    pas: 5,
    min: 180,
    max: 420,
    afficher: (v) => `${formatMinSec(v)} /km`,
    libelleMoins: "Allure course plus rapide",
    libellePlus: "Allure course plus lente",
  },
  {
    cle: "ftp",
    sport: "Vélo",
    intitule: "Puissance seuil (FTP)",
    defaut: 220,
    pas: 5,
    min: 80,
    max: 450,
    afficher: (v) => `${v} W`,
    libelleMoins: "Puissance vélo moins",
    libellePlus: "Puissance vélo plus",
  },
  {
    cle: "pma_5min",
    sport: "Vélo",
    intitule: "Puissance max sur 5 min",
    defaut: 270,
    pas: 5,
    min: 100,
    max: 700,
    afficher: (v) => `${v} W`,
    libelleMoins: "Puissance max 5 min moins",
    libellePlus: "Puissance max 5 min plus",
    facultative: true,
  },
  {
    cle: "vitesse_critique_natation",
    sport: "Natation",
    intitule: "Vitesse critique (CSS)",
    defaut: 105,
    pas: 1,
    min: 70,
    max: 160,
    afficher: (v) => `${formatMinSec(v)} /100 m`,
    libelleMoins: "Allure natation plus rapide",
    libellePlus: "Allure natation plus lente",
  },
  {
    cle: "fc_seuil",
    sport: "Cardio",
    intitule: "Fréquence cardiaque au seuil",
    defaut: 168,
    pas: 1,
    min: 120,
    max: 200,
    afficher: (v) => `${v} bpm`,
    libelleMoins: "Fréquence cardiaque moins",
    libellePlus: "Fréquence cardiaque plus",
  },
];

export type ValeursTests = Record<CleMesure, number>;

export const VALEURS_PAR_DEFAUT: ValeursTests = Object.fromEntries(
  MESURES.map((m) => [m.cle, m.defaut]),
) as ValeursTests;

/** Reprend les dernières valeurs du membre, ou celles par défaut pour ce qui manque. */
export function valeursDeDepart(dernier: Partial<Record<CleMesure, number | null>> | null): ValeursTests {
  const v = { ...VALEURS_PAR_DEFAUT };
  for (const m of MESURES) {
    const x = dernier?.[m.cle];
    if (typeof x === "number" && x >= m.min && x <= m.max) v[m.cle] = x;
  }
  return v;
}

/** Mesures facultatives renseignées dans le dernier test (cochées d'avance dans le formulaire). */
export function facultativesFaites(dernier: Partial<Record<CleMesure, number | null>> | null): CleMesure[] {
  return MESURES.filter((m) => m.facultative && typeof dernier?.[m.cle] === "number").map((m) => m.cle);
}

/** Valeurs enregistrées : une mesure facultative non faite est vide. */
export type ValeursSaisies = Record<CleMesure, number | null>;

/** Vérifie les valeurs envoyées par le formulaire (une mesure facultative absente est enregistrée vide). */
export function lireValeurs(formData: FormData): { valeurs: ValeursSaisies } | { erreur: string } {
  const valeurs = {} as ValeursSaisies;
  for (const m of MESURES) {
    const brut = formData.get(m.cle);
    if (m.facultative && (brut === null || brut === "")) {
      valeurs[m.cle] = null;
      continue;
    }
    const n = typeof brut === "string" && /^\d+$/.test(brut) ? Number(brut) : NaN;
    if (!Number.isInteger(n) || n < m.min || n > m.max) {
      return { erreur: `${m.sport} : la valeur doit être entre ${m.afficher(m.min)} et ${m.afficher(m.max)}.` };
    }
    valeurs[m.cle] = n;
  }
  return { valeurs };
}
