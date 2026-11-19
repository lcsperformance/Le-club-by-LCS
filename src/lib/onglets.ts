export const ONGLETS = [
  { cle: "accueil", libelle: "Accueil", chemin: "/accueil" },
  { cle: "semaine", libelle: "Semaine", chemin: "/semaine" },
  { cle: "ressources", libelle: "Ressources", chemin: "/ressources" },
  { cle: "club", libelle: "Club", chemin: "/club" },
  { cle: "avantages", libelle: "Avantages", chemin: "/avantages" },
] as const;

export type CleOnglet = (typeof ONGLETS)[number]["cle"];

/** Onglet à mettre en valeur pour une adresse donnée (sous-pages comprises). */
export function ongletActif(chemin: string): CleOnglet | null {
  const onglet = ONGLETS.find((o) => chemin === o.chemin || chemin.startsWith(`${o.chemin}/`));
  return onglet?.cle ?? null;
}
