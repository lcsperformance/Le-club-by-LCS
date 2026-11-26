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
const CHEMINS_PUBLICS = [
  "/connexion",
  "/mot-de-passe-oublie",
  "/auth/confirm",
  "/bienvenue",
  "/api/stripe/webhook",
  "/api/rappels-faq",
  // Pages légales : lisibles avant tout achat.
  "/mentions-legales",
  "/cgv",
  "/confidentialite",
];

/**
 * Pages d'aperçu avec des données fictives, pour les tests automatiques d'affichage.
 * Elles n'existent que si la variable APERCU vaut « 1 » (jamais en production).
 */
export const PREFIXES_APERCU = ["/apercu-espace", "/apercu-membre", "/apercu-conditions", "/apercu-mot-de-passe"];

export function apercuActif(): boolean {
  return process.env.APERCU === "1" && process.env.VERCEL_ENV !== "production";
}

export function estCheminPublic(chemin: string): boolean {
  const publics = apercuActif() ? [...CHEMINS_PUBLICS, ...PREFIXES_APERCU] : CHEMINS_PUBLICS;
  return publics.some((p) => chemin === p || chemin.startsWith(`${p}/`));
}

