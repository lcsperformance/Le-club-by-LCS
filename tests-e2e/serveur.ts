/**
 * Démarre l'app compilée (`next start`) une seule fois pour tous les tests navigateur,
 * avec APERCU=1 pour les écrans à données fictives.
 */
import { spawn, type ChildProcess } from "node:child_process";

export const PORT = 3210;
export const BASE = `http://localhost:${PORT}`;

let serveur: ChildProcess | undefined;

export async function setup() {
  serveur = spawn("npx", ["next", "start", "-p", String(PORT)], {
    env: {
      ...process.env,
      APERCU: "1",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://exemple.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "cle-de-test",
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/connexion`)).ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Le serveur Next.js n'a pas démarré (as-tu lancé `next build` ?)");
}

export async function teardown() {
  serveur?.kill();
}
