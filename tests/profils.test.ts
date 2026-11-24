import { beforeEach, describe, expect, it, vi } from "vitest";
import configFichier from "../config/profils.json";
import { validerConfigProfils } from "@/lib/config-profils";
import { CONFIG_PROFILS, estNiveau, estProfil } from "@/lib/profils";

describe("fichier config/profils.json", () => {
  it("contient les 3 niveaux et les 2 profils avec les textes demandés", () => {
    expect(Object.values(CONFIG_PROFILS.niveaux).map((n) => n.libelle)).toEqual(["Finisher", "Challenger", "Performer"]);
    expect(CONFIG_PROFILS.profils.extensif.description).toBe(
      "Tu tiens facilement la durée. Ton plan te fait travailler l'intensité pour gagner en vitesse.",
    );
    expect(CONFIG_PROFILS.profils.intensif.description).toBe(
      "Tu es à l'aise dans les efforts courts et intenses. Ton plan te fait travailler l'endurance pour tenir plus longtemps.",
    );
  });

  const avec = (modif: (c: typeof configFichier) => void) => () => {
    const c = structuredClone(configFichier);
    modif(c);
    return validerConfigProfils(c);
  };

  it("refuse un texte vide, avec un message clair", () => {
    expect(avec((c) => (c.profils.intensif.description = "  "))).toThrow(/description » du profil « intensif »/);
  });
  it("refuse une clé renommée", () => {
    expect(
      avec((c) => {
        const n = c.niveaux as Record<string, { libelle: string }>;
        n.expert = n.performer;
        delete n.performer;
      }),
    ).toThrow(/niveau « performer »/);
  });
  it("refuse une clé inconnue", () => {
    expect(avec((c) => ((c.profils as Record<string, unknown>).mixte = { libelle: "Mixte", description: "x" }))).toThrow(
      /clé inconnue « mixte »/,
    );
  });
});

describe("valeurs acceptées", () => {
  it("niveaux et profils de la base uniquement", () => {
    expect(["finisher", "challenger", "performer"].every(estNiveau)).toBe(true);
    expect(["extensif", "intensif"].every(estProfil)).toBe(true);
    expect(estNiveau("expert")).toBe(false);
    expect(estProfil("Extensif")).toBe(false);
  });
});

describe("enregistrement d'un choix", () => {
  const update = vi.fn();
  const eq = vi.fn();
  let connecte: { id: string } | null = { id: "moi" };

  beforeEach(() => {
    vi.resetModules();
    update.mockReset();
    eq.mockReset().mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    connecte = { id: "moi" };
    vi.doMock("@/lib/auth", () => ({ utilisateurConnecte: async () => connecte }));
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ update }) }) }));
  });

  it("modifie seulement la fiche du membre connecté", async () => {
    const { enregistrerChoix } = await import("@/app/(membre)/profil/actions");
    expect(await enregistrerChoix("niveau", "performer")).toEqual({});
    expect(update).toHaveBeenCalledWith({ niveau: "performer" });
    expect(eq).toHaveBeenCalledWith("id", "moi");
  });

  it.each([
    ["niveau", "expert"],
    ["profil", "mixte"],
    ["role", "admin"],
  ] as const)("refuse %s = %s sans toucher la base", async (champ, valeur) => {
    const { enregistrerChoix } = await import("@/app/(membre)/profil/actions");
    expect(await enregistrerChoix(champ as "niveau", valeur)).toEqual({ erreur: "Ce choix n'existe pas." });
    expect(update).not.toHaveBeenCalled();
  });

  it("demande de se reconnecter si la session a expiré", async () => {
    connecte = null;
    const { enregistrerChoix } = await import("@/app/(membre)/profil/actions");
    expect((await enregistrerChoix("profil", "intensif")).erreur).toMatch(/session a expiré/);
  });
});

describe("enregistrement du prénom", () => {
  const update = vi.fn();
  const eq = vi.fn();
  beforeEach(() => {
    vi.resetModules();
    update.mockReset();
    eq.mockReset().mockResolvedValue({ error: null });
    update.mockReturnValue({ eq });
    vi.doMock("@/lib/auth", () => ({ utilisateurConnecte: async () => ({ id: "moi" }) }));
    vi.doMock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: () => ({ update }) }) }));
  });

  it("enregistre le prénom nettoyé sur la fiche du membre connecté", async () => {
    const { enregistrerPrenom } = await import("@/app/(membre)/profil/actions");
    expect(await enregistrerPrenom("  Anne-Sophie ")).toEqual({ prenom: "Anne-Sophie" });
    expect(update).toHaveBeenCalledWith({ prenom: "Anne-Sophie" });
    expect(eq).toHaveBeenCalledWith("id", "moi");
  });

  it("vide = efface le prénom", async () => {
    const { enregistrerPrenom } = await import("@/app/(membre)/profil/actions");
    expect(await enregistrerPrenom("")).toEqual({ prenom: null });
    expect(update).toHaveBeenCalledWith({ prenom: null });
  });

  it("refuse une saisie invalide sans toucher la base", async () => {
    const { enregistrerPrenom } = await import("@/app/(membre)/profil/actions");
    expect((await enregistrerPrenom("<script>")).erreur).toMatch(/lettres/);
    expect(update).not.toHaveBeenCalled();
  });
});
