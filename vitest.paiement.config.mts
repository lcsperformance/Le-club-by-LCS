import { defineConfig } from "vitest/config";

/** Parcours de paiement de bout en bout (Stripe mode test → site en ligne → Supabase). */
export default defineConfig({
  test: {
    include: ["tests-paiement/**/*.test.ts"],
    testTimeout: 180_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
