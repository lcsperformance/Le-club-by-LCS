import { describe, expect, it, vi } from "vitest";
import {
  cleDepuisNom,
  erreurFichier,
  lireContenu,
  lireLienYoutube,
  lireSousRubrique,
  lireTheme,
  nouveauChemin,
  resumeContenu,
} from "@/lib/admin/ressources";
import { THEMES_FICTIFS as THEMES } from "@/lib/apercu";

vi.mock("server-only", () => ({}));

describe("lien YouTube", () => {
  it("accepte toutes les formes de lien, et l'identifiant seul", () => {
    for (const lien of [
      "https://youtu.be/dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ?si=abc",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
      "youtube.com/watch?v=dQw4w9WgXcQ",
      "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ",
      " dQw4w9WgXcQ ",
    ]) {
      expect(lireLienYoutube(lien), lien).toEqual({ id: "dQw4w9WgXcQ" });
    }
  });

  it("refuse ce qui n'est pas une vidéo YouTube", () => {
    for (const lien of ["https://vimeo.com/123456", "https://www.youtube.com/watch?v=court", "https://youtube.com/@leclub", "bonjour", ""]) {
      expect(lireLienYoutube(lien), lien).toHaveProperty("erreur");
    }
  });
});

describe("clé tirée du nom", () => {
  it("minuscules sans accent, « _ » entre les mots", () => {
    expect(cleDepuisNom("Récupération", [])).toBe("recuperation");
    expect(cleDepuisNom("Mental & Sommeil", [])).toBe("mental_sommeil");
    expect(cleDepuisNom("Œuf à la coque", [])).toBe("oeuf_a_la_coque");
  });

  it("unique, jamais une adresse réservée, jamais vide", () => {
    expect(cleDepuisNom("Nutrition", ["nutrition"])).toBe("nutrition_b");
    expect(cleDepuisNom("Nutrition", ["nutrition", "nutrition_b"])).toBe("nutrition_c");
    expect(cleDepuisNom("Favoris", [])).toBe("favoris_b");
    expect(cleDepuisNom("2027 !", [])).toBe("rubrique");
    expect(cleDepuisNom("x".repeat(80), []).length).toBeLessThanOrEqual(30);
  });
});

describe("formulaires", () => {
  it("thème : nom, icône, ordre", () => {
    expect(lireTheme({ nom: " Mental ", icone: "preparation", ordre: "6" })).toEqual({ theme: { nom: "Mental", icone: "preparation", ordre: 6 } });
    expect(lireTheme({ nom: "", icone: "preparation", ordre: 1 })).toHaveProperty("erreur");
    expect(lireTheme({ nom: "Mental", icone: "pizza", ordre: 1 })).toEqual({ erreur: "Choisis une icône." });
    expect(lireTheme({ nom: "Mental", icone: "velo", ordre: 0 })).toHaveProperty("erreur");
  });

  it("sous-rubrique : nom et ordre", () => {
    expect(lireSousRubrique({ nom: "Sommeil", ordre: 3 })).toEqual({ sousRubrique: { nom: "Sommeil", ordre: 3 } });
    expect(lireSousRubrique({ nom: "x".repeat(61), ordre: 3 })).toHaveProperty("erreur");
  });

  const saisie = { theme: "nutrition", sous_rubrique: "effort", titre: "Gels et boissons", type: "video", lien: "https://youtu.be/dQw4w9WgXcQ", semaine: "4", ordre: "2" };

  it("contenu vidéo : lien lu, semaine et ordre en nombres", () => {
    expect(lireContenu(saisie, THEMES)).toEqual({
      contenu: { theme: "nutrition", sous_rubrique: "effort", titre: "Gels et boissons", type: "video", youtube_id: "dQw4w9WgXcQ", semaine_deblocage: 4, ordre: 2 },
    });
    expect(lireContenu({ ...saisie, lien: "" }, THEMES)).toMatchObject({ contenu: { youtube_id: null } });
  });

  it("contenu PDF : le lien vidéo est ignoré", () => {
    expect(lireContenu({ ...saisie, type: "pdf", lien: "n'importe quoi" }, THEMES)).toMatchObject({ contenu: { type: "pdf", youtube_id: null } });
  });

  it("chaque erreur est rattachée à son champ", () => {
    expect(
      lireContenu({ theme: "nutrition", sous_rubrique: "technique", titre: " ", type: "audio", semaine: "0", ordre: "abc" }, THEMES),
    ).toEqual({
      erreurs: {
        sous_rubrique: "Choisis une sous-rubrique de ce thème.",
        titre: "Le titre doit faire entre 1 et 120 caractères.",
        type: "Choisis PDF ou vidéo.",
        semaine: "La semaine de déblocage est un nombre entier entre 1 et 520 (1 = dès l'inscription).",
        ordre: "L'ordre est un nombre entier entre 1 et 99.",
      },
    });
    expect(lireContenu({ ...saisie, lien: "https://vimeo.com/1" }, THEMES)).toHaveProperty("erreurs.lien");
    expect(lireContenu({ ...saisie, theme: "inconnu" }, THEMES)).toEqual({ erreurs: { theme: "Choisis un thème." } });
  });
});

describe("fichiers", () => {
  const Mo = 1024 * 1024;
  it("PDF de 50 Mo au plus", () => {
    expect(erreurFichier({ type: "application/pdf", size: 3 * Mo, name: "guide.pdf" }, "pdf")).toBeNull();
    expect(erreurFichier({ type: "application/pdf", size: 51 * Mo, name: "guide.pdf" }, "pdf")).toMatch(/50 Mo/);
    expect(erreurFichier({ type: "image/png", size: Mo, name: "photo.png" }, "pdf")).toBe("Choisis un fichier PDF.");
  });

  it("miniature JPG, PNG ou WebP de 2 Mo au plus", () => {
    expect(erreurFichier({ type: "image/webp", size: Mo, name: "m.webp" }, "miniature")).toBeNull();
    expect(erreurFichier({ type: "image/gif", size: Mo, name: "m.gif" }, "miniature")).toMatch(/JPG, PNG ou WebP/);
    expect(erreurFichier({ type: "image/jpeg", size: 3 * Mo, name: "m.jpg" }, "miniature")).toMatch(/2 Mo/);
  });

  it("chemin neuf, jamais le nom d'origine", () => {
    const id = "6f1c2b9e-3d4a-4b5c-8d7e-0123456789ab";
    expect(nouveauChemin("nutrition", "pdf", "application/pdf", id)).toBe(`nutrition/${id}.pdf`);
    expect(nouveauChemin("velo", "miniature", "image/webp", id)).toBe(`velo/${id}.webp`);
  });
});

describe("liste de l'admin", () => {
  it("dit ce qu'il manque : lien ou PDF", () => {
    expect(resumeContenu({ type: "video", semaine_deblocage: 3, youtube_id: null, fichier: null })).toEqual({ texte: "Vidéo · semaine 3", manque: "lien à ajouter" });
    expect(resumeContenu({ type: "pdf", semaine_deblocage: 1, youtube_id: null, fichier: "a/b.pdf" })).toEqual({ texte: "PDF · semaine 1", manque: null });
    expect(resumeContenu({ type: "pdf", semaine_deblocage: 2, youtube_id: null, fichier: null }).manque).toBe("PDF à déposer");
  });
});
