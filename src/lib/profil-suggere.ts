/**
 * Profil suggéré d'après les tests vélo : FTP ÷ puissance max sur 5 min.
 * Seuil proche du maximum (« diesel ») → plutôt extensif ; seuil loin du maximum → plutôt intensif.
 * Seuils dans config/profils.json (« suggestion »). Ce n'est qu'une suggestion : le membre choisit lui-même.
 */
import type { ConfigProfils } from "./config-profils";
import { CONFIG_PROFILS, type Profil } from "./profils";

export type SuggestionProfil =
  /** Il manque la FTP ou la puissance max sur 5 min. */
  | { type: "sans-test" }
  /** profil null : entre les deux seuils, profil équilibré. */
  | { type: "suggere"; profil: Profil | null; pourcentage: number };

export function profilSuggere(
  tests: { ftp?: number | null; pma_5min?: number | null } | null,
  seuils: ConfigProfils["suggestion"] = CONFIG_PROFILS.suggestion,
): SuggestionProfil {
  const ftp = tests?.ftp;
  const pma = tests?.pma_5min;
  if (!ftp || !pma) return { type: "sans-test" };
  const pourcentage = Math.round((ftp * 100) / pma);
  const profil = pourcentage >= seuils.extensif_a_partir_de ? "extensif" : pourcentage < seuils.intensif_en_dessous_de ? "intensif" : null;
  return { type: "suggere", profil, pourcentage };
}
