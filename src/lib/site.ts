/**
 * Adresse publique du site, utilisée dans les liens envoyés par e-mail.
 * Fixée par configuration plutôt que déduite de la requête (dont l'en-tête « Host » peut être falsifié).
 *
 * 1. SITE_URL si définie (en production : https://le-club-by-lcs.vercel.app) ;
 * 2. sinon, sur un aperçu Vercel, l'adresse de la branche (fournie par Vercel) ;
 * 3. sinon, l'adresse locale de développement.
 */
export function urlDuSite(env: Record<string, string | undefined> = process.env): string {
  const brute =
    env.SITE_URL ||
    (env.VERCEL_BRANCH_URL && `https://${env.VERCEL_BRANCH_URL}`) ||
    (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
    "http://localhost:3000";
  return brute.replace(/\/+$/, "");
}
