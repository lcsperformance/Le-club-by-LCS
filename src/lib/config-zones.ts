/**
 * Vérification du fichier config/zones.json.
 * Ce module n'importe rien : il est aussi utilisé par scripts/verifier-zones.mjs (avant chaque compilation).
 */

/** 6 bornes en pourcentage : Z1 = [b0, b1], Z2 = [b1, b2]… Z5 = [b4, b5]. */
export type Bornes = [number, number, number, number, number, number];

export type ConfigZones = {
  noms: [string, string, string, string, string];
  course: Bornes;
  velo: Bornes;
  natation: Bornes;
  frequence_cardiaque: Bornes;
};

const LIGNES = ["course", "velo", "natation", "frequence_cardiaque"] as const;

/**
 * Vérifie le fichier de configuration. En cas d'erreur, le message dit quoi corriger :
 * la mise en ligne échoue alors, et le site en place reste intact.
 */
export function validerConfig(c: unknown): ConfigZones {
  const erreur = (m: string) => new Error(`config/zones.json : ${m}`);
  if (!c || typeof c !== "object") throw erreur("le fichier est vide ou illisible.");
  const o = c as Record<string, unknown>;

  const noms = o.noms;
  if (!Array.isArray(noms) || noms.length !== 5 || noms.some((n) => typeof n !== "string" || !n.trim())) {
    throw erreur("« noms » doit contenir exactement 5 noms de zones.");
  }

  for (const ligne of LIGNES) {
    const b = o[ligne];
    if (!Array.isArray(b) || b.length !== 6) {
      throw erreur(`« ${ligne} » doit contenir exactement 6 nombres (les bornes de Z1 à Z5).`);
    }
    if (b.some((x) => typeof x !== "number" || !Number.isFinite(x) || x <= 0 || x > 300)) {
      throw erreur(`« ${ligne} » ne doit contenir que des nombres entre 1 et 300.`);
    }
    for (let i = 1; i < 6; i++) {
      if (b[i] <= b[i - 1]) {
        throw erreur(`« ${ligne} » : les nombres doivent monter (${b[i - 1]} puis ${b[i]} n'est pas possible).`);
      }
    }
  }
  return o as unknown as ConfigZones;
}
