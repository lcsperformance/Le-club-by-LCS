import { describe, expect, it } from "vitest";
import { urlDuSite } from "@/lib/site";

describe("adresse du site pour les liens e-mail", () => {
  it("utilise SITE_URL en priorité", () => {
    expect(urlDuSite({ SITE_URL: "https://le-club-by-lcs.vercel.app/", VERCEL_BRANCH_URL: "x.vercel.app" })).toBe(
      "https://le-club-by-lcs.vercel.app",
    );
  });
  it("sur un aperçu Vercel, prend l'adresse de la branche", () => {
    expect(urlDuSite({ VERCEL_BRANCH_URL: "le-club-git-test.vercel.app", VERCEL_URL: "autre.vercel.app" })).toBe(
      "https://le-club-git-test.vercel.app",
    );
  });
  it("en local, localhost", () => {
    expect(urlDuSite({})).toBe("http://localhost:3000");
  });
});
