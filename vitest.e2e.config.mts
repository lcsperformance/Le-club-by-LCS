import { defineConfig } from "vitest/config";

/** Tests d'affichage dans un vrai navigateur : nécessitent `next build` au préalable. */
export default defineConfig({
  test: {
    include: ["tests-e2e/**/*.test.ts"],
    globalSetup: ["tests-e2e/serveur.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
