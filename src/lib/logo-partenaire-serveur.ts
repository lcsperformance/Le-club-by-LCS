import "server-only";
import { lookup } from "node:dns/promises";
import { adresseAutorisee, iconesDeclarees, ipInterne, TAILLE_MAX_LOGO, TAILLE_MIN_LOGO, typeImage, type TypeLogo } from "./logo-partenaire";

/**
 * Récupère le logo d'un partenaire sur son site (côté serveur, quand l'admin enregistre).
 * Protections : https seulement, aucun nom ou IP interne (vérifié aussi après résolution DNS, à chaque
 * redirection), 5 secondes et 1 Mo au plus par appel, et le fichier doit vraiment être une image.
 * Renvoie null si rien d'utilisable n'est trouvé : la carte garde alors l'initiale.
 */
export type Outils = {
  appeler: (adresse: string, init: RequestInit) => Promise<Response>;
  resoudre: (hote: string) => Promise<string[]>;
};

const OUTILS_REELS: Outils = {
  appeler: (adresse, init) => fetch(adresse, init),
  resoudre: async (hote) => (await lookup(hote, { all: true })).map((r) => r.address),
};

const DELAI = 5000;
const REDIRECTIONS_MAX = 3;

async function adresseSure(adresse: string, outils: Outils): Promise<boolean> {
  if (!adresseAutorisee(adresse)) return false;
  const hote = new URL(adresse).hostname.replace(/^\[|\]$/g, "");
  if (/^[\d.]+$/.test(hote) || hote.includes(":")) return true; // IP littérale déjà vérifiée
  try {
    const ips = await outils.resoudre(hote);
    return ips.length > 0 && ips.every((ip) => !ipInterne(ip));
  } catch {
    return false;
  }
}

/** Lit au plus TAILLE_MAX_LOGO octets ; null si la réponse est plus grosse. */
async function lireCorps(reponse: Response): Promise<Uint8Array | null> {
  const annonce = Number(reponse.headers.get("content-length"));
  if (annonce > TAILLE_MAX_LOGO) return null;
  if (!reponse.body) return new Uint8Array(await reponse.arrayBuffer()).slice(0, TAILLE_MAX_LOGO + 1);
  const morceaux: Uint8Array[] = [];
  let total = 0;
  const lecteur = reponse.body.getReader();
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.length;
    if (total > TAILLE_MAX_LOGO) {
      await lecteur.cancel();
      return null;
    }
    morceaux.push(value);
  }
  const tout = new Uint8Array(total);
  let i = 0;
  for (const m of morceaux) {
    tout.set(m, i);
    i += m.length;
  }
  return tout;
}

/** Appelle une adresse sûre en suivant au plus 3 redirections, chacune vérifiée. */
async function appelerSur(adresse: string, outils: Outils): Promise<{ corps: Uint8Array; adresseFinale: string; type: string } | null> {
  let courante = adresse;
  for (let i = 0; i <= REDIRECTIONS_MAX; i++) {
    if (!(await adresseSure(courante, outils))) return null;
    let reponse: Response;
    try {
      reponse = await outils.appeler(courante, {
        redirect: "manual",
        signal: AbortSignal.timeout(DELAI),
        headers: { "user-agent": "LeClub-logo/1.0", accept: "text/html,image/*;q=0.9,*/*;q=0.5" },
      });
    } catch {
      return null;
    }
    if (reponse.status >= 300 && reponse.status < 400) {
      const vers = reponse.headers.get("location");
      if (!vers) return null;
      courante = new URL(vers, courante).toString();
      continue;
    }
    if (!reponse.ok) return null;
    const corps = await lireCorps(reponse);
    return corps ? { corps, adresseFinale: courante, type: reponse.headers.get("content-type") ?? "" } : null;
  }
  return null;
}

export async function recupererLogo(siteDuPartenaire: string, outils: Outils = OUTILS_REELS): Promise<{ octets: Uint8Array; type: TypeLogo } | null> {
  const page = await appelerSur(siteDuPartenaire, outils);
  const html = page && /html/i.test(page.type) ? new TextDecoder().decode(page.corps) : "";
  const candidats = iconesDeclarees(html, page?.adresseFinale ?? siteDuPartenaire).slice(0, 5);
  for (const adresse of candidats) {
    const image = await appelerSur(adresse, outils);
    if (!image || image.corps.length < TAILLE_MIN_LOGO) continue;
    const type = typeImage(image.corps);
    if (type) return { octets: image.corps, type };
  }
  return null;
}
