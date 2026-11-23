export const ONGLETS = [
  { cle: "accueil", libelle: "Accueil", chemin: "/accueil" },
  { cle: "semaine", libelle: "Semaine", chemin: "/semaine" },
  { cle: "ressources", libelle: "Ressources", chemin: "/ressources" },
  { cle: "club", libelle: "Club", chemin: "/club" },
  { cle: "avantages", libelle: "Avantages", chemin: "/avantages" },
] as const;

export type CleOnglet = (typeof ONGLETS)[number]["cle"];

/** Sous-pages rattachées à un onglet (maquette : Ma saison et les séances sont sous « Semaine »). */
const SOUS_PAGES: Record<string, CleOnglet> = { "/saison": "semaine", "/seance": "semaine" };

/** Sous-pages qui gardent la barre sans onglet en valeur (comme dans la maquette). */
const AVEC_BARRE = ["/zones", "/profil", "/progres", "/records"];

const sous = (chemin: string, base: string) => chemin === base || chemin.startsWith(`${base}/`);

/** Onglet à mettre en valeur pour une adresse donnée (sous-pages comprises). */
export function ongletActif(chemin: string): CleOnglet | null {
  const onglet = ONGLETS.find((o) => sous(chemin, o.chemin));
  if (onglet) return onglet.cle;
  const parent = Object.keys(SOUS_PAGES).find((p) => sous(chemin, p));
  return parent ? SOUS_PAGES[parent] : null;
}

/** La barre s'affiche partout dans l'espace membre, sauf sur les écrans plein écran (tests, abonnement…). */
export function barreVisible(chemin: string): boolean {
  return ongletActif(chemin) !== null || AVEC_BARRE.some((p) => sous(chemin, p));
}
