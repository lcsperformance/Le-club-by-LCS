import "server-only";
import { integrationAutorisee, URL_CALCULATEUR } from "./calculateur";
import { urlDuSite } from "./site";

const DUREE_MEMOIRE = 60 * 60 * 1000; // le résultat est gardé une heure
let memoire: { autorise: boolean; le: number } | null = null;

/**
 * Le site de LCS autorise-t-il l'affichage du calculateur dans l'app ? Le serveur lit lui-même la réponse
 * du site. Site injoignable ou réponse en erreur : on ne tente pas l'affichage intégré (bouton « Ouvrir »).
 */
export async function calculateurIntegrable(maintenant = Date.now()): Promise<boolean> {
  if (memoire && maintenant - memoire.le < DUREE_MEMOIRE) return memoire.autorise;
  let autorise = false;
  try {
    const reponse = await fetch(URL_CALCULATEUR, { method: "GET", redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(4000) });
    autorise =
      reponse.ok &&
      integrationAutorisee({ xFrameOptions: reponse.headers.get("x-frame-options"), csp: reponse.headers.get("content-security-policy") }, urlDuSite());
    await reponse.body?.cancel();
  } catch (e) {
    console.error("Calculateur : site LCS injoignable", (e as Error).message);
  }
  memoire = { autorise, le: maintenant };
  return autorise;
}
