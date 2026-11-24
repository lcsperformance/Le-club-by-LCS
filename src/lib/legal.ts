/**
 * Textes légaux du Club : mentions légales, CGV, politique de confidentialité.
 * Changer VERSION_TEXTES quand les CGV ou la politique changent : chaque membre devra les accepter à nouveau.
 */
export const VERSION_TEXTES = "2026-11-24";

export const PAGES_LEGALES = [
  { href: "/mentions-legales", libelle: "Mentions légales" },
  { href: "/cgv", libelle: "Conditions générales de vente" },
  { href: "/confidentialite", libelle: "Politique de confidentialité" },
] as const;

/** Le membre doit-il (re)accepter les CGV et la politique ? L'équipe du Club (coach, admin) n'est pas concernée. */
export const doitAccepter = (u: { role: string; conditionsAcceptees: string | null }) =>
  u.role === "membre" && u.conditionsAcceptees !== VERSION_TEXTES;
