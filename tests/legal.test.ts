import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { doitAccepter, PAGES_LEGALES, VERSION_TEXTES } from "@/lib/legal";
import { abonnementEnCours, confirmationValide, nomFichierExport, TABLES_EXPORT } from "@/lib/mes-donnees";
import { estCheminPublic } from "@/lib/roles";

const lire = (f: string) => readFileSync(join(__dirname, "..", f), "utf8");
const MENTIONS = lire("src/app/(legal)/mentions-legales/page.tsx");
const CGV = lire("src/app/(legal)/cgv/page.tsx");
const CONFIDENTIALITE = lire("src/app/(legal)/confidentialite/page.tsx");

describe("acceptation à la première connexion", () => {
  it("un membre qui n'a jamais accepté, ou une ancienne version, doit accepter", () => {
    expect(doitAccepter({ role: "membre", conditionsAcceptees: null })).toBe(true);
    expect(doitAccepter({ role: "membre", conditionsAcceptees: "2026-01-01" })).toBe(true);
    expect(doitAccepter({ role: "membre", conditionsAcceptees: VERSION_TEXTES })).toBe(false);
  });

  it("l'équipe du Club (coach, admin) n'est pas concernée", () => {
    expect(doitAccepter({ role: "coach", conditionsAcceptees: null })).toBe(false);
    expect(doitAccepter({ role: "admin", conditionsAcceptees: null })).toBe(false);
  });

  it("exigerRole renvoie vers /conditions avant l'abonnement", () => {
    const auth = lire("src/lib/auth.ts");
    expect(auth.indexOf('redirect("/conditions")')).toBeGreaterThan(0);
    expect(auth.indexOf('redirect("/conditions")')).toBeLessThan(auth.indexOf('redirect("/abonnement")'));
  });
});

describe("pages légales", () => {
  it("lisibles sans être connecté", () => {
    for (const p of PAGES_LEGALES) expect(estCheminPublic(p.href), p.href).toBe(true);
    expect(estCheminPublic("/conditions")).toBe(false);
  });

  it("rien d'inventé : les inconnues sont laissées « à compléter »", () => {
    for (const manque of ["adresse du siège", "directeur de la publication", "RCS ou RNE", "adresse et téléphone de Vercel"]) {
      expect(MENTIONS, manque).toContain(manque);
    }
    expect(CGV).toContain("modèle de formulaire de rétractation");
    expect(CGV).toContain("médiateur de la consommation</ACompleter>");
  });

  it("CGV : formules, sans engagement, résiliation depuis le portail Stripe", () => {
    expect(CGV).toContain('prixFormule("mensuelle")');
    expect(CGV).toContain('prixFormule("annuelle")');
    expect(CGV).toContain("sans engagement");
    expect(CGV).toContain("portail client");
    expect(CGV).toContain("Stripe");
  });

  it("confidentialité : prestataires, RPE et commentaires lus seulement par le membre et l'encadrement", () => {
    for (const p of ["Vercel", "Supabase", "Stripe", "Resend"]) expect(CONFIDENTIALITE).toContain(p);
    expect(CONFIDENTIALITE).toContain("uniquement par vous et par l&apos;encadrement du Club");
    expect(CONFIDENTIALITE).toContain("RPE");
    expect(CONFIDENTIALITE).not.toMatch(/douleur/i);
    expect(CONFIDENTIALITE).toContain("Télécharger mes données");
    expect(CONFIDENTIALITE).toContain("Supprimer mon compte");
  });
});

describe("mes données", () => {
  it("l'export ne contient jamais le programme d'entraînement", () => {
    const tables = TABLES_EXPORT.map((t) => t.table);
    expect(tables).not.toContain("programme");
    expect(tables).not.toContain("blocs_seance");
    expect(TABLES_EXPORT.find((t) => t.table === "appareils_notifications")?.colonnes).not.toMatch(/p256dh|auth|endpoint/);
    expect(nomFichierExport("2026-11-24")).toBe("le-club-mes-donnees-2026-11-24.json");
  });

  it("suppression : il faut taper SUPPRIMER", () => {
    expect(confirmationValide("SUPPRIMER")).toBe(true);
    expect(confirmationValide(" supprimer ")).toBe(true);
    expect(confirmationValide("oui")).toBe(false);
    expect(confirmationValide(undefined)).toBe(false);
  });

  it("résilier l'abonnement Stripe s'il peut encore être prélevé", () => {
    expect(["active", "trialing", "past_due", "unpaid"].every(abonnementEnCours)).toBe(true);
    expect(["canceled", "incomplete_expired"].some(abonnementEnCours)).toBe(false);
  });
});
