import { beforeEach, describe, expect, it, vi } from "vitest";

const signOut = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signOut } }) }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

describe("se déconnecter", () => {
  beforeEach(() => signOut.mockReset());

  it("ne ferme que la session de cet appareil, puis renvoie vers la connexion", async () => {
    const { seDeconnecter } = await import("@/app/auth/actions");
    await expect(seDeconnecter()).rejects.toThrow("redirect:/connexion?message=deconnecte");
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
