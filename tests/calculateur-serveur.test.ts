/** Le serveur lit la réponse du site LCS pour savoir s'il peut afficher le calculateur dans l'app. */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const reponse = (statut: number, entetes: Record<string, string> = {}) => new Response("<html></html>", { status: statut, headers: entetes });

beforeEach(() => {
  vi.resetModules(); // repart d'une mémoire vide à chaque test
  vi.stubEnv("SITE_URL", "https://le-club-by-lcs.vercel.app");
});

describe("calculateurIntegrable", () => {
  it("site qui autorise : cadre intégré", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reponse(200)));
    const { calculateurIntegrable } = await import("@/lib/calculateur-serveur");
    expect(await calculateurIntegrable()).toBe(true);
  });

  it("site qui refuse (X-Frame-Options ou frame-ancestors) : bouton « Ouvrir le calculateur »", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reponse(200, { "x-frame-options": "SAMEORIGIN" })));
    expect(await (await import("@/lib/calculateur-serveur")).calculateurIntegrable()).toBe(false);
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => reponse(200, { "content-security-policy": "frame-ancestors 'self'" })));
    expect(await (await import("@/lib/calculateur-serveur")).calculateurIntegrable()).toBe(false);
  });

  it("site injoignable ou en erreur : bouton, jamais un cadre vide", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("délai dépassé"))));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await (await import("@/lib/calculateur-serveur")).calculateurIntegrable()).toBe(false);
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn(async () => reponse(503)));
    expect(await (await import("@/lib/calculateur-serveur")).calculateurIntegrable()).toBe(false);
  });

  it("le résultat est gardé une heure, puis vérifié à nouveau", async () => {
    const appels = vi.fn(async () => reponse(200));
    vi.stubGlobal("fetch", appels);
    const { calculateurIntegrable } = await import("@/lib/calculateur-serveur");
    const t0 = Date.parse("2027-01-11T10:00:00Z");
    await calculateurIntegrable(t0);
    await calculateurIntegrable(t0 + 59 * 60 * 1000);
    expect(appels).toHaveBeenCalledTimes(1);
    await calculateurIntegrable(t0 + 61 * 60 * 1000);
    expect(appels).toHaveBeenCalledTimes(2);
  });
});
