export const LONGUEUR_MIN_MOT_DE_PASSE = 8;

/** Renvoie un message d'erreur en français, ou null si le mot de passe convient. */
export function validerNouveauMotDePasse(motDePasse: string, confirmation: string): string | null {
  if (motDePasse.length < LONGUEUR_MIN_MOT_DE_PASSE) {
    return `Ton mot de passe doit faire au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`;
  }
  if (!/[a-zA-Z]/.test(motDePasse) || !/[0-9]/.test(motDePasse)) {
    return "Ton mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  if (motDePasse !== confirmation) {
    return "Les deux mots de passe ne sont pas identiques.";
  }
  return null;
}
