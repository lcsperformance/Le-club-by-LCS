import { describe, expect, it, vi } from "vitest";
import { THEMES_FICTIFS as THEMES } from "@/lib/apercu";

vi.mock("server-only", () => ({}));
import {
  cartesThemes,
  dateCommentaire,
  estDebloquee,
  favoris,
  lireCommentaire,
  metaRessource,
  semaineAnciennete,
  sousRubriques,
  themeParCle,
  vueContenu,
  type Ressource,
} from "@/lib/ressources";

const r = (id: string, theme: string, sous_rubrique: string, type: Ressource["type"], semaine_deblocage: number, ordre = 1): Ressource => ({
  id,
  theme,
  sous_rubrique,
  titre: `Contenu ${id}`,
  type,
  semaine_deblocage,
  ordre,
});

const CATALOGUE = [
  r("a", "nutrition", "effort", "video", 3, 1),
  r("b", "nutrition", "bases", "pdf", 1, 2),
  r("c", "nutrition", "bases", "video", 1, 1),
  r("d", "nutrition", "effort", "pdf", 4, 2),
  r("e", "velo", "puissance", "video", 2),
  r("x", "nutrition", "rubrique_supprimee", "pdf", 1),
];

describe("ancienneté et déblocage", () => {
  it("semaine 1 la première semaine après l'inscription, puis +1 tous les 7 jours", () => {
    expect(semaineAnciennete("2027-01-04", "2027-01-04")).toBe(1);
    expect(semaineAnciennete("2027-01-04", "2027-01-10")).toBe(1);
    expect(semaineAnciennete("2027-01-04", "2027-01-11")).toBe(2);
    expect(semaineAnciennete("2027-01-04", "2027-01-25")).toBe(4);
  });

  it("débloqué si la semaine est atteinte ; l'équipe du Club (null) voit tout", () => {
    expect(estDebloquee({ semaine_deblocage: 3 }, 3)).toBe(true);
    expect(estDebloquee({ semaine_deblocage: 4 }, 3)).toBe(false);
    expect(estDebloquee({ semaine_deblocage: 52 }, null)).toBe(true);
  });

  it("« Vidéo · débloqué semaine 6 » sur un contenu verrouillé", () => {
    expect(metaRessource({ type: "video", semaine_deblocage: 6 }, false)).toBe("Vidéo · débloqué semaine 6");
    expect(metaRessource({ type: "pdf", semaine_deblocage: 1 }, true)).toBe("PDF");
  });
});

describe("membre inscrit depuis 2 semaines (écran)", () => {
  const inscription = "2027-01-04";
  const aujourdhui = "2027-01-18"; // 14 jours plus tard
  const semaine = semaineAnciennete(inscription, aujourdhui);
  const media = { youtube_id: "dQw4w9WgXcQ", fichier_disponible: true };

  it("est en semaine 3", () => {
    expect(semaine).toBe(3);
  });

  it("voit en clair un contenu débloqué à la semaine 1", () => {
    expect(vueContenu(r("s1", "nutrition", "bases", "video", 1), semaine, undefined, media)).toMatchObject({
      debloquee: true,
      meta: "Vidéo",
      miniature: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    });
  });

  it("voit verrouillé un contenu débloqué à la semaine 4, avec sa semaine d'ouverture", () => {
    expect(vueContenu(r("s4", "nutrition", "effort", "pdf", 4), semaine, { favori: true, consulte_le: "2027-01-10T10:00:00Z" }, media)).toEqual({
      id: "s4",
      titre: "Contenu s4",
      type: "pdf",
      meta: "PDF · débloqué semaine 4",
      badge: null,
      debloquee: false,
      favori: false,
      miniature: null,
    });
  });
});

describe("classement", () => {
  it("cartes des thèmes : contenus débloqués sur le total, rubriques inconnues ignorées", () => {
    const cartes = cartesThemes(THEMES, CATALOGUE, 3);
    expect(cartes.find((c) => c.cle === "nutrition")?.compte).toBe("3 / 4 contenus");
    expect(cartes.find((c) => c.cle === "velo")?.compte).toBe("1 / 1 contenu");
    expect(cartes.find((c) => c.cle === "natation")?.compte).toBe("0 / 0 contenu");
  });

  it("sous-rubriques dans leur ordre, contenus dans leur ordre", () => {
    const s = sousRubriques(themeParCle(THEMES, "nutrition")!, CATALOGUE);
    expect(s.map((x) => x.nom)).toEqual(["Les bases de la nutrition", "Nutrition à l'effort"]);
    expect(s[0].contenus.map((c) => c.id)).toEqual(["c", "b"]);
  });

  it("favoris : seulement ceux qui sont débloqués", () => {
    const suivis = { a: { favori: true, consulte_le: null }, d: { favori: true, consulte_le: null }, e: { favori: false, consulte_le: null } };
    expect(favoris(THEMES, CATALOGUE, suivis, 3).map((c) => c.id)).toEqual(["a"]);
  });
});

describe("carte d'un contenu", () => {
  it("« Vue » pour une vidéo, « Téléchargé » pour un PDF", () => {
    const vu = { favori: true, consulte_le: "2027-01-08T18:00:00Z" };
    expect(vueContenu(CATALOGUE[2], 3, vu).badge).toBe("Vue");
    expect(vueContenu(CATALOGUE[1], 3, vu).badge).toBe("Téléchargé");
    expect(vueContenu(CATALOGUE[1], 3).badge).toBeNull();
  });

  it("miniature choisie par l'admin ou celle de YouTube, seulement pour une vidéo débloquée", () => {
    const perso = { youtube_id: "dQw4w9WgXcQ", fichier_disponible: false, miniature: "https://exemple.supabase.co/miniature.webp" };
    expect(vueContenu(CATALOGUE[2], 3, undefined, perso).miniature).toBe("https://exemple.supabase.co/miniature.webp");
    expect(vueContenu(CATALOGUE[0], 2, undefined, perso).miniature).toBeNull();
    const media = { youtube_id: "dQw4w9WgXcQ", fichier_disponible: false };
    expect(vueContenu(CATALOGUE[2], 3, undefined, media).miniature).toBe("https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg");
    expect(vueContenu(CATALOGUE[0], 2, undefined, media)).toMatchObject({ miniature: null, debloquee: false, favori: false, badge: null });
  });
});

describe("commentaires", () => {
  it("1 à 500 caractères", () => {
    expect(lireCommentaire("  Merci !  ")).toEqual({ texte: "Merci !" });
    expect(lireCommentaire("   ")).toEqual({ erreur: "Écris ton commentaire avant de le publier." });
    expect(lireCommentaire("x".repeat(501))).toEqual({ erreur: "Ton commentaire dépasse 500 caractères." });
  });

  it("date et heure à la française, à l'heure de Paris", () => {
    expect(dateCommentaire("2027-01-08T17:42:00Z")).toBe("08/01/2027 · 18 h 42");
  });
});
