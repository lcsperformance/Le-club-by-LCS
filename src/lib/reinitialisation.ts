/**
 * Le changement de mot de passe sans l'ancien n'est permis qu'après un lien reçu par e-mail
 * (« mot de passe oublié » ou invitation), et seulement dans les minutes qui suivent.
 * Sinon, quelqu'un qui trouverait un téléphone déjà connecté pourrait changer le mot de passe.
 */

/** Méthodes de connexion qui prouvent l'accès à la boîte mail (lien ou code reçu par e-mail). */
const METHODES_PAR_EMAIL = new Set(["otp", "magiclink", "recovery", "invite"]);

export const DUREE_REINITIALISATION_MINUTES = 15;

type EntreeAmr = { method: string; timestamp: number } | string;

/**
 * Vrai si la session vient d'un lien e-mail utilisé il y a moins de 15 minutes.
 * `amr` est la liste des méthodes de connexion du jeton Supabase (horodatées en secondes).
 */
export function estSessionDeReinitialisation(amr: unknown, maintenant: Date = new Date()): boolean {
  if (!Array.isArray(amr)) return false;
  const limite = maintenant.getTime() / 1000 - DUREE_REINITIALISATION_MINUTES * 60;
  return (amr as EntreeAmr[]).some(
    (e) => typeof e === "object" && e !== null && METHODES_PAR_EMAIL.has(e.method) && e.timestamp >= limite,
  );
}
