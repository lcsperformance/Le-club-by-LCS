/**
 * Espace admin « Membres » : recherche, ancienneté, état de l'accès,
 * et refus des actions pour toute personne qui n'est pas admin.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  anciennete,
  etatAcces,
  filtrerMembres,
  finDeJourneeParis,
  libelleJournal,
  libelleStatut,
  type MembreAdmin,
} from "@/lib/admin/membres";

// ---------------------------------------------------------------------------
// Faux services pour les actions serveur
// ---------------------------------------------------------------------------
const appels = vi.hoisted(() => ({
  role: "admin" as string | null,
  rpc: [] as { fn: string; args: unknown }[],
  stripe: [] as string[],
  emails: [] as string[],
  abonnement: { status: "active", cancel_at_period_end: false },
  derniereConnexion: null as string | null,
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  utilisateurConnecte: async () => (appels.role ? { id: "admin-1", role: appels.role } : null),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    rpc: async (fn: string, args: unknown) => {
      appels.rpc.push({ fn, args });
      return { error: null };
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { stripe_subscription_id: "sub_1", email: "caroline@exemple.fr", role: "membre" },
          }),
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        getUserById: async () => ({ data: { user: { last_sign_in_at: appels.derniereConnexion } } }),
        inviteUserByEmail: async (email: string) => {
          appels.emails.push(`invitation:${email}`);
          return { error: null };
        },
      },
      resetPasswordForEmail: async (email: string) => {
        appels.emails.push(`mot-de-passe:${email}`);
        return { error: null };
      },
    },
  }),
}));
vi.mock("@/lib/abonnement/stripe", () => ({
  stripe: () => ({
    subscriptions: {
      retrieve: async (id: string) => {
        appels.stripe.push(`lire:${id}`);
        return appels.abonnement;
      },
      update: async (id: string, p: { cancel_at_period_end: boolean }) => {
        appels.stripe.push(`resilier-fin-de-periode:${id}:${p.cancel_at_period_end}`);
      },
    },
  }),
}));
vi.mock("@/lib/site", () => ({ urlDuSite: () => "https://club.exemple" }));

import { couperAcces, offrirAcces, renvoyerEmailAcces } from "@/app/(espace)/admin/membres/actions";

beforeEach(() => {
  appels.role = "admin";
  appels.rpc = [];
  appels.stripe = [];
  appels.emails = [];
  appels.abonnement = { status: "active", cancel_at_period_end: false };
  appels.derniereConnexion = null;
});

describe("actions réservées à l'admin", () => {
  it.each([
    ["un membre", "membre"],
    ["un coach", "coach"],
    ["un visiteur non connecté", null],
  ])("%s est refusé : rien n'est modifié, aucun appel à Stripe, aucun e-mail", async (_, role) => {
    appels.role = role;
    for (const r of [
      await offrirAcces("m1", "2099-01-01"),
      await couperAcces("m1", true),
      await couperAcces("m1", false),
      await renvoyerEmailAcces("m1"),
    ]) {
      expect(r.erreur).toBe("Action réservée à un administrateur.");
    }
    expect(appels.rpc).toEqual([]);
    expect(appels.stripe).toEqual([]);
    expect(appels.emails).toEqual([]);
  });
});

describe("couper l'accès", () => {
  it("coupe l'accès ET programme la résiliation Stripe à la fin de la période payée", async () => {
    const r = await couperAcces("m1", true);
    expect(appels.rpc).toEqual([{ fn: "admin_couper_acces", args: { cible: "m1", coupe: true } }]);
    expect(appels.stripe).toEqual(["lire:sub_1", "resilier-fin-de-periode:sub_1:true"]);
    expect(r.info).toMatch(/fin de la période payée/);
  });

  it("résiliation déjà prévue : rien de plus chez Stripe", async () => {
    appels.abonnement = { status: "active", cancel_at_period_end: true };
    await couperAcces("m1", true);
    expect(appels.stripe).toEqual(["lire:sub_1"]);
  });

  it("abonnement déjà terminé : rien chez Stripe", async () => {
    appels.abonnement = { status: "canceled", cancel_at_period_end: false };
    const r = await couperAcces("m1", true);
    expect(appels.stripe).toEqual(["lire:sub_1"]);
    expect(r.info).toMatch(/déjà terminé/);
  });

  it("rétablir l'accès ne touche pas à Stripe", async () => {
    await couperAcces("m1", false);
    expect(appels.rpc).toEqual([{ fn: "admin_couper_acces", args: { cible: "m1", coupe: false } }]);
    expect(appels.stripe).toEqual([]);
  });
});

describe("ouvrir l'accès", () => {
  it("jusqu'au soir de la date choisie (heure de Paris)", async () => {
    await offrirAcces("m1", "2099-03-15");
    expect(appels.rpc).toEqual([
      { fn: "admin_offrir_acces", args: { cible: "m1", jusqua: "2099-03-15T22:59:59.000Z" } },
    ]);
  });
  it("refuse une date passée ou invalide, sans rien appeler", async () => {
    expect((await offrirAcces("m1", "2020-01-01")).erreur).toMatch(/à venir/);
    expect((await offrirAcces("m1", "pas une date")).erreur).toMatch(/valide/);
    expect(appels.rpc).toEqual([]);
  });
  it("retirer l'accès offert", async () => {
    await offrirAcces("m1", null);
    expect(appels.rpc).toEqual([{ fn: "admin_offrir_acces", args: { cible: "m1", jusqua: null } }]);
  });
});

describe("renvoyer l'e-mail d'accès", () => {
  it("jamais connecté : renvoie l'e-mail de bienvenue, noté au journal", async () => {
    const r = await renvoyerEmailAcces("m1");
    expect(appels.emails).toEqual(["invitation:caroline@exemple.fr"]);
    expect(appels.rpc).toEqual([{ fn: "admin_noter_email_acces", args: { cible: "m1", detail: "Invitation" } }]);
    expect(r.info).toMatch(/bienvenue/);
  });
  it("déjà connecté : envoie l'e-mail « choisir un nouveau mot de passe »", async () => {
    appels.derniereConnexion = "2026-11-19T10:00:00Z";
    await renvoyerEmailAcces("m1");
    expect(appels.emails).toEqual(["mot-de-passe:caroline@exemple.fr"]);
    expect(appels.rpc[0].args).toEqual({ cible: "m1", detail: "Nouveau mot de passe" });
  });
});

// ---------------------------------------------------------------------------
// Logique de la liste
// ---------------------------------------------------------------------------
const MAINTENANT = new Date("2027-01-10T10:00:00Z");
const membre = (m: Partial<MembreAdmin> = {}): MembreAdmin => ({
  id: "m",
  email: "elodie.martin@exemple.fr",
  prenom: "Élodie",
  niveau: null,
  statut_abonnement: "actif",
  abonnement_fin: "2027-02-10T10:00:00.000Z",
  annulation_prevue: false,
  formule: "mensuelle",
  date_inscription: "2026-11-02T10:00:00.000Z",
  acces_offert_jusqua: null,
  acces_coupe: false,
  ...m,
});

describe("recherche", () => {
  const liste = [membre(), membre({ id: "t", prenom: "Thomas", email: "tb@club.fr" }), membre({ id: "x", prenom: null, email: "inconnu@club.fr" })];
  it("par prénom, sans accents ni majuscules", () => {
    expect(filtrerMembres(liste, "elodie").map((m) => m.id)).toEqual(["m"]);
    expect(filtrerMembres(liste, "ÉLO").map((m) => m.id)).toEqual(["m"]);
  });
  it("par e-mail, même partiel, et même sans prénom", () => {
    expect(filtrerMembres(liste, "inconnu@").map((m) => m.id)).toEqual(["x"]);
    expect(filtrerMembres(liste, "club.fr").map((m) => m.id)).toEqual(["t", "x"]);
  });
  it("plusieurs mots : tous doivent correspondre ; vide : tout le monde", () => {
    expect(filtrerMembres(liste, "thomas tb@").map((m) => m.id)).toEqual(["t"]);
    expect(filtrerMembres(liste, "thomas inconnu")).toEqual([]);
    expect(filtrerMembres(liste, "  ")).toHaveLength(3);
  });
});

describe("ancienneté", () => {
  it.each([
    ["2027-01-10T08:00:00Z", "Membre depuis aujourd'hui"],
    ["2027-01-09T10:00:00Z", "Membre depuis 1 jour"],
    ["2026-12-20T10:00:00Z", "Membre depuis 21 jours"],
    ["2026-11-02T10:00:00Z", "Membre depuis 2 mois"],
    ["2026-01-10T10:00:00Z", "Membre depuis 1 an"],
    ["2024-11-02T10:00:00Z", "Membre depuis 2 ans et 2 mois"],
  ])("inscrit le %s → « %s »", (date, attendu) => {
    expect(anciennete(date, MAINTENANT)).toBe(attendu);
  });
});

describe("statut et accès", () => {
  it("statuts en clair", () => {
    expect(libelleStatut(membre()).texte).toBe("Abonné");
    expect(libelleStatut(membre({ annulation_prevue: true })).texte).toBe("Résiliation prévue");
    expect(libelleStatut(membre({ statut_abonnement: "impaye" })).texte).toBe("Paiement en échec");
    expect(libelleStatut(membre({ statut_abonnement: "resilie" })).texte).toBe("Résilié");
    expect(libelleStatut(membre({ statut_abonnement: "inactif" })).texte).toBe("Jamais abonné");
  });
  it("accès : abonnement, offert, coupé, aucun", () => {
    expect(etatAcces(membre(), MAINTENANT).texte).toBe("Accès jusqu'au 10/02/2027");
    expect(etatAcces(membre({ abonnement_fin: null, acces_offert_jusqua: "2027-06-30T21:59:59Z" }), MAINTENANT).texte).toBe(
      "Accès offert jusqu'au 30/06/2027",
    );
    expect(etatAcces(membre({ acces_coupe: true }), MAINTENANT)).toEqual({ texte: "Accès coupé par l'admin", ton: "alerte" });
    expect(etatAcces(membre({ abonnement_fin: "2026-12-01T10:00:00Z" }), MAINTENANT).texte).toBe("Pas d'accès");
  });
  it("journal en clair", () => {
    expect(libelleJournal({ action: "acces_offert", detail: "30/06/2027" })).toBe("Accès offert jusqu'au 30/06/2027");
    expect(libelleJournal({ action: "email_acces_renvoye", detail: "Invitation" })).toBe("E-mail d'accès renvoyé (Invitation)");
    expect(libelleJournal({ action: "acces_coupe", detail: null })).toBe("Accès coupé");
  });
  it("fin de journée à Paris, hiver comme été", () => {
    expect(finDeJourneeParis("2027-01-15")?.toISOString()).toBe("2027-01-15T22:59:59.000Z");
    expect(finDeJourneeParis("2027-07-15")?.toISOString()).toBe("2027-07-15T21:59:59.000Z");
    expect(finDeJourneeParis("15/07/2027")).toBeNull();
  });
});

describe("pages de l'espace admin", () => {
  it("chaque page sous /admin exige le rôle admin (un membre ou un coach est renvoyé chez lui)", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const racine = join(__dirname, "..", "src", "app", "(espace)", "admin");
    const pages = (readdirSync(racine, { recursive: true }) as string[]).filter((f) => f.endsWith("page.tsx"));
    expect(pages).toEqual(expect.arrayContaining(["page.tsx", join("membres", "page.tsx")]));
    for (const p of pages) {
      expect(readFileSync(join(racine, p), "utf8"), p).toMatch(/await exigerRole\("admin"\)/);
    }
  });
});
