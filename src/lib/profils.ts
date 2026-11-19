/** Niveaux et profils proposés au membre ; textes dans config/profils.json. */
import configBrute from "../../config/profils.json";
import { NIVEAUX, PROFILS, validerConfigProfils, type Niveau, type Profil } from "./config-profils";

export { NIVEAUX, PROFILS, type Niveau, type Profil } from "./config-profils";

/** Configuration validée au chargement : une erreur bloque la compilation. */
export const CONFIG_PROFILS = validerConfigProfils(configBrute);

export const estNiveau = (v: unknown): v is Niveau => (NIVEAUX as readonly unknown[]).includes(v);
export const estProfil = (v: unknown): v is Profil => (PROFILS as readonly unknown[]).includes(v);
