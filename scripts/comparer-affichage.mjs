/**
 * Prouve qu'un changement ne modifie pas l'affichage sur téléphone (320, 360, 390 px)
 * ni sur iPad (768 × 1024 et 1024 × 768) : chaque écran est photographié sur l'app compilée
 * de la branche et sur celle de la référence (main par défaut), puis comparé pixel par pixel.
 *
 *   npm run build                      (l'app de la branche doit être compilée)
 *   npm run comparer-affichage         (référence : origin/main)
 *   npm run comparer-affichage -- --ref autre-branche --ecrans club
 *
 * La référence est préparée dans .captures/reference (copie de travail git, compilée une fois
 * par commit). Les écarts sont enregistrés dans .captures/differences (référence | branche | écarts en rose).
 * Les deux versions sont photographiées l'une après l'autre pour chaque écran : les dates du jour sont les mêmes.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { ECRANS, TABLETTES, TELEPHONES } from "../tests-e2e/ecrans.ts";

const RACINE = new URL("..", import.meta.url).pathname;
const DOSSIER = join(RACINE, ".captures");
const REFERENCE = join(DOSSIER, "reference");
const DIFFERENCES = join(DOSSIER, "differences");
const PORT_BRANCHE = 3220;
const PORT_REFERENCE = 3221;
const EN_PARALLELE = 4;
/** Écart toléré par couleur (sur 255) : en dessous, l'œil ne voit rien. */
const TOLERANCE = 8;

const args = process.argv.slice(2);
const option = (nom, defaut) => {
  const i = args.indexOf(`--${nom}`);
  return i >= 0 ? args[i + 1] : defaut;
};
const ref = option("ref", "origin/main");
const filtre = option("ecrans", "");

const env = {
  ...process.env,
  APERCU: "1",
  NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://exemple.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "cle-de-test",
};

const git = (...a) => execFileSync("git", a, { cwd: RACINE, encoding: "utf8" }).trim();

/** Copie de travail de la référence, compilée une seule fois par commit. */
function preparerReference() {
  if (!existsSync(join(RACINE, ".next", "BUILD_ID"))) {
    throw new Error("L'app de la branche n'est pas compilée : lance d'abord `npm run build`.");
  }
  const commit = git("rev-parse", ref);
  const marque = join(REFERENCE, ".commit-compile");
  if (existsSync(marque) && readFileSync(marque, "utf8") === commit) {
    console.log(`Référence ${ref} (${commit.slice(0, 7)}) déjà compilée.`);
    return commit;
  }
  console.log(`Préparation de la référence ${ref} (${commit.slice(0, 7)})…`);
  if (existsSync(REFERENCE)) {
    try {
      git("worktree", "remove", "--force", REFERENCE);
    } catch {
      rmSync(REFERENCE, { recursive: true, force: true });
    }
  }
  git("worktree", "prune");
  mkdirSync(DOSSIER, { recursive: true });
  git("worktree", "add", "--detach", REFERENCE, commit);
  // Installation à part : la compilation refuse un node_modules pris hors de son dossier.
  execFileSync("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], { cwd: REFERENCE, env, stdio: "inherit" });
  execFileSync("npx", ["next", "build"], { cwd: REFERENCE, env, stdio: "inherit" });
  writeFileSync(marque, commit);
  return commit;
}

/** Démarre `next start` dans un dossier ; renvoie une fonction d'arrêt. */
async function demarrer(dossier, port) {
  const serveur = spawn("npx", ["next", "start", "-p", String(port)], { cwd: dossier, env, detached: true, stdio: "ignore" });
  const arreter = () => {
    try {
      process.kill(-serveur.pid, "SIGTERM");
    } catch {
      // déjà arrêté
    }
  };
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(`http://localhost:${port}/connexion`)).ok) return arreter;
    } catch {
      // pas encore prêt
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  arreter();
  throw new Error(`Le serveur du port ${port} n'a pas démarré (port déjà pris ?).`);
}

async function photographier(navigateur, port, ecran, largeur, hauteur) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, isMobile: true, hasTouch: true });
  try {
    await page.goto(`http://localhost:${port}${ecran}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
    await page.evaluate(() => document.fonts.ready);
    return await page.screenshot({ fullPage: true, animations: "disabled", caret: "hide" });
  } finally {
    await page.close();
  }
}

/** Compare deux images pixel par pixel dans le navigateur ; renvoie le nombre d'écarts et une image côte à côte. */
async function comparer(page, avant, apres) {
  return page.evaluate(
    async ([a, b, TOLERANCE]) => {
      const charger = (src) =>
        new Promise((ok, ko) => {
          const img = new Image();
          img.onload = () => ok(img);
          img.onerror = ko;
          img.src = `data:image/png;base64,${src}`;
        });
      const [ia, ib] = await Promise.all([charger(a), charger(b)]);
      const l = Math.max(ia.width, ib.width);
      const h = Math.max(ia.height, ib.height);
      const pixels = (img) => {
        const c = new OffscreenCanvas(l, h);
        const ctx = c.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, l, h).data;
      };
      const pa = pixels(ia);
      const pb = pixels(ib);
      const sortie = new OffscreenCanvas(l * 3, h);
      const ctx = sortie.getContext("2d");
      ctx.drawImage(ia, 0, 0);
      ctx.drawImage(ib, l, 0);
      // Tolérance infime par couleur, et un pixel isolé ne compte pas : le lissage des coins des
      // champs natifs varie d'une capture à l'autre. Un vrai changement (même une ligne d'un pixel)
      // touche toujours des pixels voisins.
      const differe = new Uint8Array(l * h);
      for (let p = 0; p < l * h; p++) {
        const i = p * 4;
        differe[p] = [0, 1, 2, 3].some((k) => Math.abs(pa[i + k] - pb[i + k]) > TOLERANCE) ? 1 : 0;
      }
      const voisin = (x, y) => {
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const vx = x + dx;
            const vy = y + dy;
            if ((dx || dy) && vx >= 0 && vy >= 0 && vx < l && vy < h && differe[vy * l + vx]) return true;
          }
        return false;
      };
      const ecarts = ctx.createImageData(l, h);
      let n = 0;
      for (let p = 0; p < l * h; p++) {
        const i = p * 4;
        const diff = differe[p] && voisin(p % l, Math.floor(p / l));
        if (diff) n++;
        ecarts.data.set(diff ? [250, 148, 255, 255] : [pa[i] / 4, pa[i + 1] / 4, pa[i + 2] / 4, 255], i);
      }
      ctx.putImageData(ecarts, l * 2, 0);
      const blob = await sortie.convertToBlob({ type: "image/png" });
      const octets = new Uint8Array(await blob.arrayBuffer());
      let binaire = "";
      for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
      return { n, tailles: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}`, image: btoa(binaire) };
    },
    [avant.toString("base64"), apres.toString("base64"), TOLERANCE],
  );
}

const commit = preparerReference();
const formats = [...TELEPHONES.map((l) => [l, 780]), ...TABLETTES];
const cas = ECRANS.filter((e) => e.includes(filtre)).flatMap((ecran) => formats.map(([l, h]) => ({ ecran, l, h })));

rmSync(DIFFERENCES, { recursive: true, force: true });
mkdirSync(DIFFERENCES, { recursive: true });

const arrets = [await demarrer(RACINE, PORT_BRANCHE), await demarrer(REFERENCE, PORT_REFERENCE)];
const navigateur = await chromium.launch();
const ecarts = [];
let faits = 0;
try {
  const comparateur = await navigateur.newPage();
  const file = [...cas];
  const travailler = async () => {
    for (let c = file.shift(); c; c = file.shift()) {
      faits++;
      // En cas d'écart, deuxième prise : un rendu instable du navigateur n'est pas un changement.
      let r;
      for (let essai = 0; essai < 2; essai++) {
        const avant = await photographier(navigateur, PORT_REFERENCE, c.ecran, c.l, c.h);
        const apres = await photographier(navigateur, PORT_BRANCHE, c.ecran, c.l, c.h);
        r = avant.equals(apres) ? { n: 0 } : await comparer(comparateur, avant, apres);
        if (r.n === 0) break;
      }
      if (r.n === 0) continue;
      const nom = `${c.ecran.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "")}-${c.l}x${c.h}.png`;
      writeFileSync(join(DIFFERENCES, nom), Buffer.from(r.image, "base64"));
      ecarts.push(`${c.ecran} à ${c.l} × ${c.h} : ${r.n} pixels (${r.tailles}) → .captures/differences/${nom}`);
      console.log(`✖ ${ecarts.at(-1)}`);
    }
  };
  await Promise.all(Array.from({ length: EN_PARALLELE }, travailler));
} finally {
  await navigateur.close();
  arrets.forEach((arreter) => arreter());
}

console.log(`\n${faits} captures comparées à ${ref} (${commit.slice(0, 7)}).`);
if (ecarts.length) {
  console.error(`\n✖ ${ecarts.length} écran(s) changent sur téléphone ou iPad :\n${ecarts.map((e) => `  - ${e}`).join("\n")}`);
  process.exit(1);
}
console.log("✔ Aucun changement sur téléphone ni sur iPad.");
