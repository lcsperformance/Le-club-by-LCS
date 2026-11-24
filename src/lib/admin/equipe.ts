/**
 * Équipe du Club : rôle de chaque compte, choisi par un admin dans /admin/equipe.
 * « Coach + admin » = droits d'un admin (membres.role = 'admin') mais présenté comme « Coach »
 * aux membres (membres.affiche_coach = true). Changement par admin_changer_role_equipe() (base).
 */
import { normaliser } from "./membres";

export const CHOIX_ROLES = [
  { cle: "membre", libelle: "Membre", aide: "Son espace seulement." },
  { cle: "coach", libelle: "Coach", aide: "Espace coach : fiches des athlètes, en lecture seule." },
  { cle: "coach_admin", libelle: "Coach + admin", aide: "Droits d'un admin, présenté comme « Coach » aux membres." },
  { cle: "admin", libelle: "Admin", aide: "Espace coach et administration ; présenté comme « Équipe du Club »." },
] as const;

export type ChoixRole = (typeof CHOIX_ROLES)[number]["cle"];

export type CompteEquipe = {
  id: string;
  email: string;
  prenom: string | null;
  nom: string | null;
  role: "membre" | "coach" | "admin";
  affiche_coach: boolean;
};

export const choixDuCompte = (c: Pick<CompteEquipe, "role" | "affiche_coach">): ChoixRole =>
  c.role === "admin" && c.affiche_coach ? "coach_admin" : c.role;

export const estChoixRole = (v: unknown): v is ChoixRole => CHOIX_ROLES.some((c) => c.cle === v);

export const libelleChoix = (choix: ChoixRole) => CHOIX_ROLES.find((c) => c.cle === choix)!.libelle;

/**
 * Comptes affichés : l'équipe (coachs et admins) toujours ; les membres seulement quand on cherche
 * (prénom, nom ou e-mail), pour en faire un coach. Équipe d'abord, puis ordre alphabétique.
 */
export function comptesAffiches(comptes: CompteEquipe[], recherche: string): CompteEquipe[] {
  const mots = normaliser(recherche).split(/\s+/).filter(Boolean);
  const nom = (c: CompteEquipe) => [c.prenom, c.nom].filter(Boolean).join(" ") || c.email;
  return comptes
    .filter((c) => (mots.length ? mots.every((m) => normaliser(`${nom(c)} ${c.email}`).includes(m)) : c.role !== "membre"))
    .sort((a, b) => Number(a.role === "membre") - Number(b.role === "membre") || nom(a).localeCompare(nom(b), "fr"));
}
