/**
 * Calculateur LCS Performance : page du site de LCS, affichée dans l'app si le site l'autorise.
 * Un site peut interdire d'être affiché dans une autre page (« X-Frame-Options » ou la règle
 * « frame-ancestors » de sa politique de sécurité) : dans ce cas, l'app propose de l'ouvrir dans le navigateur.
 */

export const URL_CALCULATEUR = "https://lcsperformance.fr/outils/calculateur-ttzv9zrg.html";

/** Une source de « frame-ancestors » (ex. https://*.vercel.app) autorise-t-elle cette origine ? */
function sourceAutorise(source: string, origine: URL): boolean {
  if (source === "*") return true;
  const m = /^(?:(https?):\/\/)?(\*\.)?([a-z0-9.-]+)(?::(\d+|\*))?\/?$/i.exec(source);
  if (!m) return false;
  const [, schema, joker, hote] = m;
  if (schema && `${schema}:` !== origine.protocol) return false;
  const h = origine.hostname.toLowerCase();
  const attendu = hote.toLowerCase();
  return joker ? h.endsWith(`.${attendu}`) : h === attendu;
}

/**
 * Le site autorise-t-il l'affichage de sa page dans l'app (origine de l'app, ex. https://le-club-by-lcs.vercel.app) ?
 * La règle « frame-ancestors » prime sur « X-Frame-Options » quand elle est présente (comportement des navigateurs).
 */
export function integrationAutorisee(entetes: { xFrameOptions?: string | null; csp?: string | null }, origineApp: string): boolean {
  const origine = new URL(origineApp);
  const directive = (entetes.csp ?? "")
    .split(";")
    .map((d) => d.trim())
    .find((d) => /^frame-ancestors(\s|$)/i.test(d));
  if (directive) {
    const sources = directive.split(/\s+/).slice(1);
    if (!sources.length || sources.includes("'none'")) return false;
    return sources.some((s) => s !== "'self'" && sourceAutorise(s, origine));
  }
  const xfo = (entetes.xFrameOptions ?? "").trim().toUpperCase();
  return !(xfo.startsWith("DENY") || xfo.startsWith("SAMEORIGIN") || xfo.startsWith("ALLOW-FROM"));
}
