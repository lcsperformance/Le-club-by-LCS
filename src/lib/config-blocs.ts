/**
 * Vérification de config/blocs.json (durée des blocs de préparation, en semaines).
 * Ce module n'importe rien : il est aussi utilisé par scripts/verifier-config.mjs.
 * Les clés correspondent au type « bloc » de la base (S, M, L, XL).
 */

export const BLOCS = ["S", "M", "L", "XL"] as const;
export type Bloc = (typeof BLOCS)[number];

export type ConfigBlocs = { blocs: Record<Bloc, { semaines: number; provisoire: boolean }> };

export function validerConfigBlocs(c: unknown): ConfigBlocs {
  const erreur = (m: string) => new Error(`config/blocs.json : ${m}`);
  if (!c || typeof c !== "object") throw erreur("le fichier est vide ou illisible.");
  const blocs = (c as { blocs?: Record<string, Record<string, unknown>> }).blocs;
  if (!blocs || typeof blocs !== "object") throw erreur("il manque la liste « blocs ».");

  for (const b of BLOCS) {
    const s = blocs[b]?.semaines;
    if (!Number.isInteger(s) || (s as number) < 1 || (s as number) > 52) {
      throw erreur(`la durée « semaines » du bloc ${b} doit être un nombre entier entre 1 et 52 (sans guillemets).`);
    }
    if (typeof blocs[b].provisoire !== "boolean") {
      throw erreur(`« provisoire » du bloc ${b} doit valoir true ou false (sans guillemets).`);
    }
  }
  const inconnu = Object.keys(blocs).find((k) => !(BLOCS as readonly string[]).includes(k));
  if (inconnu) throw erreur(`bloc inconnu « ${inconnu} » : ne renommez pas les clés S, M, L, XL.`);
  return c as ConfigBlocs;
}
