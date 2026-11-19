/**
 * Démarre l'app compilée (`next start`) une seule fois pour tous les tests navigateur,
 * avec APERCU=1 pour les écrans à données fictives.
 */
import { spawn, type ChildProcess } from "node:child_process";

export const PORT = 3210;
export const BASE = `http://localhost:${PORT}`;

let serveur: ChildProcess | undefined;

async function repond() {
  try {
    return (await fetch(`${BASE}/connexion`)).ok;
  } catch {
    return false;
  }
}

export async function setup() {
  // Un ancien serveur encore allumé servirait une version périmée de l'app : on refuse.
  if (await repond()) {
    throw new Error(`Le port ${PORT} est déjà utilisé (ancien serveur de test ?). Arrêtez-le avant de relancer.`);
  }
  serveur = spawn("npx", ["next", "start", "-p", String(PORT)], {
    // Groupe de processus à part : on pourra arrêter « npx » ET le serveur Next qu'il lance.
    detached: true,
    env: {
      ...process.env,
      APERCU: "1",
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://exemple.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "cle-de-test",
    },
    stdio: "ignore",
  });
  for (let i = 0; i < 60; i++) {
    if (await repond()) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Le serveur Next.js n'a pas démarré (as-tu lancé `next build` ?)");
}

export async function teardown() {
  // Arrête tout le groupe (npx et le serveur Next), sinon le serveur reste allumé en arrière-plan.
  if (serveur?.pid) {
    try {
      process.kill(-serveur.pid, "SIGTERM");
    } catch {
      // déjà arrêté
    }
  }
}
