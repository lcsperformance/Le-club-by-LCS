/**
 * Logo d'un partenaire pris sur son site : règles testables, sans réseau.
 * - quelles icônes le site déclare (apple-touch-icon d'abord, puis la plus grande, puis /favicon.ico) ;
 * - quelles adresses on accepte d'appeler (https, jamais une adresse interne) ;
 * - quel fichier est vraiment une image (on lit ses premiers octets, pas ce que le site prétend).
 */

export type TypeLogo = { ext: "png" | "jpg" | "webp" | "ico"; mime: string };

/** 1 Mo au plus (page du site comme image). */
export const TAILLE_MAX_LOGO = 1024 * 1024;

const attribut = (balise: string, nom: string) =>
  balise.match(new RegExp(`\\b${nom}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(2).find((v) => v !== undefined) ?? null;

/** Plus grand côté annoncé par « sizes » (« 180x180 » → 180, « any » → 512). */
function taille(sizes: string | null): number {
  if (!sizes) return 0;
  if (/any/i.test(sizes)) return 512;
  return Math.max(0, ...[...sizes.matchAll(/(\d+)x(\d+)/gi)].map((m) => Math.max(+m[1], +m[2])));
}

/**
 * Adresses des icônes déclarées par la page (dans l'ordre où les essayer), puis /favicon.ico.
 * Les icônes SVG sont ignorées (elles peuvent contenir du code).
 */
export function iconesDeclarees(html: string, adressePage: string): string[] {
  const trouvees: { url: string; rang: number; taille: number }[] = [];
  for (const balise of html.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attribut(balise, "rel") ?? "").toLowerCase();
    const href = attribut(balise, "href");
    if (!href || !/\b(icon|apple-touch-icon(-precomposed)?)\b/.test(rel)) continue;
    if (/\.svg(\?|#|$)/i.test(href) || /svg/i.test(attribut(balise, "type") ?? "")) continue;
    let url: string;
    try {
      url = new URL(href.replace(/&amp;/g, "&"), adressePage).toString();
    } catch {
      continue;
    }
    trouvees.push({ url, rang: rel.includes("apple-touch-icon") ? 0 : 1, taille: taille(attribut(balise, "sizes")) });
  }
  trouvees.sort((a, b) => a.rang - b.rang || b.taille - a.taille);
  const urls = trouvees.map((t) => t.url);
  try {
    urls.push(new URL("/favicon.ico", adressePage).toString());
  } catch {
    // adresse de page invalide : pas de favicon à essayer
  }
  return [...new Set(urls)];
}

/** Adresse IP interne, locale ou réservée (IPv4 ou IPv6) : jamais appelée par le serveur. */
export function ipInterne(ip: string): boolean {
  const v4 = ip.replace(/^::ffff:/i, "");
  const m = v4.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [+m[1], +m[2]];
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const x = ip.toLowerCase();
  return x === "::" || x === "::1" || x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe80") || !x.includes(":");
}

/** Adresse que le serveur accepte d'appeler : https, port normal, pas d'identifiants, pas de nom ou d'IP interne. */
export function adresseAutorisee(adresse: string): boolean {
  let u: URL;
  try {
    u = new URL(adresse);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return false;
  const hote = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!hote.includes(".") || hote === "localhost" || hote.endsWith(".localhost") || hote.endsWith(".local") || hote.endsWith(".internal")) return false;
  if (/^[\d.]+$/.test(hote) || hote.includes(":")) return !ipInterne(hote);
  return true;
}

/** Type réel d'une image d'après ses premiers octets (PNG, JPEG, WebP, ICO), sinon null. */
export function typeImage(o: Uint8Array): TypeLogo | null {
  if (o.length < 12) return null;
  if (o[0] === 0x89 && o[1] === 0x50 && o[2] === 0x4e && o[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (o[0] === 0xff && o[1] === 0xd8 && o[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (o[0] === 0x52 && o[1] === 0x49 && o[2] === 0x46 && o[3] === 0x46 && o[8] === 0x57 && o[9] === 0x45 && o[10] === 0x42 && o[11] === 0x50)
    return { ext: "webp", mime: "image/webp" };
  if (o[0] === 0 && o[1] === 0 && o[2] === 1 && o[3] === 0) return { ext: "ico", mime: "image/x-icon" };
  return null;
}

/** Une image trop petite (pixel de suivi, icône vide) n'est pas un logo. */
export const TAILLE_MIN_LOGO = 100;
