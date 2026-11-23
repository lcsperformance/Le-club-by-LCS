/**
 * Route de téléchargement d'un PDF des Ressources : pour un contenu verrouillé, la base ne donne pas
 * le chemin du fichier, donc aucun lien de téléchargement n'est créé, même en tapant l'adresse.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const ID_VERROUILLE = "de000000-0000-0000-0001-000000000004";
const ID_OUVERT = "de000000-0000-0000-0001-000000000002";

const creerLien = vi.fn();
const rpc = vi.fn();
const suivi = { update: vi.fn(), insert: vi.fn() };

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  utilisateurConnecte: async () => ({ id: "00000000-0000-0000-0000-0000000000b2", role: "membre" }),
  aAccesEspace: () => true,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    // Comme la base : fichier_ressource() ne renvoie le chemin que d'un contenu débloqué.
    rpc: (...a: unknown[]) => rpc(...a),
    storage: { from: () => ({ createSignedUrl: (...a: unknown[]) => creerLien(...a) }) },
    from: () => ({
      update: (...a: unknown[]) => {
        suivi.update(...a);
        const chaine = { eq: () => chaine, select: async () => ({ data: [{ id: "s1" }] }) };
        return chaine;
      },
      insert: async (...a: unknown[]) => suivi.insert(...a),
    }),
  }),
}));

const appeler = async (id: string) => {
  const { GET } = await import("@/app/(membre)/ressources/contenu/[id]/telecharger/route");
  return GET(new Request(`http://localhost/ressources/contenu/${id}/telecharger`), { params: Promise.resolve({ id }) });
};

beforeEach(() => {
  creerLien.mockReset().mockResolvedValue({ data: { signedUrl: "https://stockage.exemple/lien-temporaire" }, error: null });
  rpc.mockReset().mockImplementation(async (_nom: string, { rid }: { rid: string }) => ({
    data: rid === ID_OUVERT ? "nutrition/guide-repas.pdf" : null,
  }));
  suivi.update.mockReset();
  suivi.insert.mockReset();
});

describe("téléchargement d'un PDF", () => {
  it("contenu verrouillé : retour à la page du contenu, aucun lien créé, rien noté", async () => {
    const r = await appeler(ID_VERROUILLE);
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe(`http://localhost/ressources/contenu/${ID_VERROUILLE}`);
    expect(rpc).toHaveBeenCalledWith("fichier_ressource", { rid: ID_VERROUILLE });
    expect(creerLien).not.toHaveBeenCalled();
    expect(suivi.update).not.toHaveBeenCalled();
  });

  it("contenu débloqué : lien temporaire de 60 secondes, noté « Téléchargé »", async () => {
    const r = await appeler(ID_OUVERT);
    expect(r.status).toBe(303);
    expect(r.headers.get("location")).toBe("https://stockage.exemple/lien-temporaire");
    expect(creerLien).toHaveBeenCalledWith("nutrition/guide-repas.pdf", 60, { download: true });
    expect(suivi.update).toHaveBeenCalledWith(expect.objectContaining({ consulte_le: expect.any(String) }));
  });

  it("adresse inventée : retour aux Ressources", async () => {
    const r = await appeler("pas-un-identifiant");
    expect(r.headers.get("location")).toBe("http://localhost/ressources");
    expect(creerLien).not.toHaveBeenCalled();
  });
});
