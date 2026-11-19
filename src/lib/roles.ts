export const ROLES = ["membre", "coach", "admin"] as const;
export type Role = (typeof ROLES)[number];

/** Page d'arrivée après la connexion, selon le rôle. */
export function cheminAccueil(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    default:
      return "/accueil";
  }
}

/** Pages accessibles sans être connecté. */
const CHEMINS_PUBLICS = ["/connexion", "/mot-de-passe-oublie", "/auth/confirm"];

export function estCheminPublic(chemin: string): boolean {
  return CHEMINS_PUBLICS.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}

