/**
 * Abonnement Stripe : règles d'état et d'accès, et traitement du webhook,
 * avec un faux Stripe et une fausse base en mémoire.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { aAcces, etatDepuisAbonnement, type AbonnementStripe } from "@/lib/abonnement/etat";
import { traiterEvenement, type Dependances, type EvenementStripe, type MembreConnu } from "@/lib/abonnement/webhook";

const JOUR = 24 * 3600;
const MAINTENANT = Math.floor(new Date("2027-01-10T10:00:00Z").getTime() / 1000);
const FIN = MAINTENANT + 20 * JOUR;

function abonnement(status: string, opts: Partial<AbonnementStripe> = {}): AbonnementStripe {
  return { id: "sub_1", status, cancel_at_period_end: false, ended_at: null, items: { data: [{ current_period_end: FIN }] }, ...opts };
}

describe("état de l'abonnement", () => {
  it("actif : accès jusqu'à la fin de la période payée", () => {
    expect(etatDepuisAbonnement(abonnement("active"))).toEqual({
      statut: "actif",
      fin: new Date(FIN * 1000).toISOString(),
      annulationPrevue: false,
    });
  });
  it("résiliation demandée : toujours actif jusqu'à la fin de période, résiliation prévue", () => {
    expect(etatDepuisAbonnement(abonnement("active", { cancel_at_period_end: true })).annulationPrevue).toBe(true);
  });
  it("paiement en échec : impayé, mais la période déjà payée reste acquise", () => {
    const e = etatDepuisAbonnement(abonnement("past_due"));
    expect(e.statut).toBe("impaye");
    expect(e.fin).toBe(new Date(FIN * 1000).toISOString());
  });
  it("terminé : résilié, accès jusqu'à la date de fin", () => {
    const e = etatDepuisAbonnement(abonnement("canceled", { ended_at: MAINTENANT }));
    expect(e).toEqual({ statut: "resilie", fin: new Date(MAINTENANT * 1000).toISOString(), annulationPrevue: false });
  });
  it("pas encore payé : inactif, aucun accès", () => {
    expect(etatDepuisAbonnement(abonnement("incomplete"))).toEqual({ statut: "inactif", fin: null, annulationPrevue: false });
  });
});

describe("accès à l'espace membre", () => {
  const maintenant = new Date(MAINTENANT * 1000);
  const avant = new Date((MAINTENANT - JOUR) * 1000).toISOString();
  const apres = new Date((MAINTENANT + JOUR) * 1000).toISOString();
  it("ouvert jusqu'à la fin de la période payée, fermé ensuite", () => {
    expect(aAcces({ role: "membre", abonnement_fin: apres }, maintenant)).toBe(true);
    expect(aAcces({ role: "membre", abonnement_fin: avant }, maintenant)).toBe(false);
    expect(aAcces({ role: "membre", abonnement_fin: null }, maintenant)).toBe(false);
  });
  it("toujours ouvert pour le coach et l'admin", () => {
    expect(aAcces({ role: "coach", abonnement_fin: null }, maintenant)).toBe(true);
    expect(aAcces({ role: "admin", abonnement_fin: avant }, maintenant)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Faux Stripe et fausse base
// ---------------------------------------------------------------------------
type Fiche = MembreConnu & {
  stripe_customer_id: string | null;
  abonnement_fin: string | null;
  annulation_prevue: boolean;
};

let fiches: Fiche[];
let traites: Set<string>;
let abonnementsStripe: Record<string, AbonnementStripe>;
let emailsBienvenue: string[];
let emailsReabonnement: string[];
let creationConcurrente: boolean;

function deps(): Dependances {
  return {
    stripe: {
      abonnement: async (id) => abonnementsStripe[id],
      emailClient: async () => "client@exemple.fr",
    },
    base: {
      dejaTraite: async (id) => traites.has(id),
      marquerTraite: async (id) => void traites.add(id),
      membreParClient: async (c) => fiches.find((f) => f.stripe_customer_id === c) ?? null,
      membreParEmail: async (e) => fiches.find((f) => f.email === e) ?? null,
      creerCompteEtInviter: async (email) => {
        if (creationConcurrente) {
          // Un autre événement vient de créer le compte (et d'envoyer l'invitation).
          fiches.push(nouvelleFiche(email));
          return { existeDeja: true as const };
        }
        if (fiches.some((f) => f.email === email)) return { existeDeja: true as const };
        const f = nouvelleFiche(email);
        fiches.push(f);
        emailsBienvenue.push(email);
        return { id: f.id };
      },
      mettreAJour: async (id, champs) => {
        Object.assign(fiches.find((f) => f.id === id)!, champs);
      },
    },
    emails: { reabonnement: async (e) => void emailsReabonnement.push(e) },
  };
}

function nouvelleFiche(email: string, autres: Partial<Fiche> = {}): Fiche {
  return {
    id: `u_${fiches.length + 1}`,
    email,
    role: "membre",
    statut_abonnement: "inactif",
    stripe_subscription_id: null,
    stripe_customer_id: null,
    abonnement_fin: null,
    annulation_prevue: false,
    ...autres,
  };
}

const paiementInitial = (email = "Nouvelle@Exemple.fr", sub = "sub_1"): EvenementStripe => ({
  id: `evt_checkout_${sub}`,
  type: "checkout.session.completed",
  data: { object: { mode: "subscription", subscription: sub, customer: "cus_1", customer_details: { email } } },
});
const facture = (type: string, n: number, sub = "sub_1"): EvenementStripe => ({
  id: `evt_${type}_${n}`,
  type,
  data: { object: { customer: "cus_1", customer_email: "nouvelle@exemple.fr", parent: { subscription_details: { subscription: sub } } } },
});
const majAbonnement = (type: string, n: number): EvenementStripe => ({
  id: `evt_${type}_${n}`,
  type,
  data: { object: { id: "sub_1", customer: "cus_1" } },
});

beforeEach(() => {
  fiches = [];
  traites = new Set();
  abonnementsStripe = { sub_1: abonnement("active") };
  emailsBienvenue = [];
  emailsReabonnement = [];
  creationConcurrente = false;
});

describe("webhook : paiement réussi", () => {
  it("crée le compte, envoie l'e-mail de bienvenue et ouvre l'accès", async () => {
    const r = await traiterEvenement(paiementInitial(), deps());
    expect(r.action).toBe("compte-cree");
    expect(emailsBienvenue).toEqual(["nouvelle@exemple.fr"]);
    expect(fiches[0]).toMatchObject({
      email: "nouvelle@exemple.fr",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      statut_abonnement: "actif",
      abonnement_fin: new Date(FIN * 1000).toISOString(),
    });
  });

  it("ne crée pas de compte si l'abonnement n'est pas payé", async () => {
    abonnementsStripe.sub_1 = abonnement("incomplete");
    expect((await traiterEvenement(paiementInitial(), deps())).action).toBe("ignore");
    expect(fiches).toEqual([]);
  });
});

describe("webhook : cas de bord", () => {
  it("webhook reçu deux fois : appliqué une seule fois", async () => {
    await traiterEvenement(paiementInitial(), deps());
    const r = await traiterEvenement(paiementInitial(), deps());
    expect(r.action).toBe("deja-traite");
    expect(fiches).toHaveLength(1);
    expect(emailsBienvenue).toHaveLength(1);
  });

  it("deux événements différents du même premier paiement : un seul compte, un seul e-mail", async () => {
    await traiterEvenement(facture("invoice.paid", 1), deps());
    await traiterEvenement(paiementInitial(), deps());
    expect(fiches).toHaveLength(1);
    expect(emailsBienvenue).toEqual(["nouvelle@exemple.fr"]);
    expect(emailsReabonnement).toEqual([]);
  });

  it("compte créé en même temps par un autre événement : repris, sans e-mail en double", async () => {
    creationConcurrente = true;
    const r = await traiterEvenement(paiementInitial(), deps());
    expect(r.action).toBe("mis-a-jour");
    expect(fiches).toHaveLength(1);
    expect(fiches[0].statut_abonnement).toBe("actif");
    expect(emailsBienvenue).toEqual([]);
    expect(emailsReabonnement).toEqual([]);
  });

  it("paiement en échec : impayé, l'accès reste jusqu'à la fin de la période payée", async () => {
    await traiterEvenement(paiementInitial(), deps());
    abonnementsStripe.sub_1 = abonnement("past_due");
    await traiterEvenement(facture("invoice.payment_failed", 2), deps());
    expect(fiches[0].statut_abonnement).toBe("impaye");
    expect(aAcces(fiches[0], new Date(MAINTENANT * 1000))).toBe(true);
    expect(aAcces(fiches[0], new Date((FIN + 60) * 1000))).toBe(false);
  });

  it("paiement relancé avec succès : de nouveau actif, accès prolongé", async () => {
    await traiterEvenement(paiementInitial(), deps());
    abonnementsStripe.sub_1 = abonnement("past_due");
    await traiterEvenement(facture("invoice.payment_failed", 2), deps());
    const nouvelleFin = FIN + 30 * JOUR;
    abonnementsStripe.sub_1 = abonnement("active", { items: { data: [{ current_period_end: nouvelleFin }] } });
    await traiterEvenement(facture("invoice.paid", 3), deps());
    expect(fiches[0].statut_abonnement).toBe("actif");
    expect(fiches[0].abonnement_fin).toBe(new Date(nouvelleFin * 1000).toISOString());
  });

  it("résiliation demandée : accès jusqu'à la fin de la période, puis coupé", async () => {
    await traiterEvenement(paiementInitial(), deps());
    abonnementsStripe.sub_1 = abonnement("active", { cancel_at_period_end: true });
    await traiterEvenement(majAbonnement("customer.subscription.updated", 2), deps());
    expect(fiches[0]).toMatchObject({ statut_abonnement: "actif", annulation_prevue: true });

    abonnementsStripe.sub_1 = abonnement("canceled", { ended_at: FIN });
    await traiterEvenement(majAbonnement("customer.subscription.deleted", 3), deps());
    expect(fiches[0].statut_abonnement).toBe("resilie");
    expect(aAcces(fiches[0], new Date((FIN - 60) * 1000))).toBe(true);
    expect(aAcces(fiches[0], new Date((FIN + 60) * 1000))).toBe(false);
  });

  it("événements dans le désordre : l'état réel relu chez Stripe l'emporte", async () => {
    await traiterEvenement(paiementInitial(), deps());
    abonnementsStripe.sub_1 = abonnement("canceled", { ended_at: FIN });
    // L'ancien « paiement réussi » arrive après la résiliation : il ne réactive rien.
    await traiterEvenement(facture("invoice.paid", 9), deps());
    expect(fiches[0].statut_abonnement).toBe("resilie");
  });

  it("e-mail déjà existant (ancien membre) : pas de nouveau compte, réactivé, e-mail de reprise", async () => {
    fiches.push(
      nouvelleFiche("nouvelle@exemple.fr", { statut_abonnement: "resilie", stripe_subscription_id: "sub_ancien" }),
    );
    const r = await traiterEvenement(paiementInitial("nouvelle@exemple.fr", "sub_1"), deps());
    expect(r.action).toBe("reabonnement");
    expect(fiches).toHaveLength(1);
    expect(fiches[0]).toMatchObject({ statut_abonnement: "actif", stripe_subscription_id: "sub_1" });
    expect(emailsBienvenue).toEqual([]);
    expect(emailsReabonnement).toEqual(["nouvelle@exemple.fr"]);
    // Le second événement du même réabonnement ne renvoie pas d'e-mail.
    await traiterEvenement(facture("invoice.paid", 2), deps());
    expect(emailsReabonnement).toHaveLength(1);
  });

  it.each(["coach", "admin"])("l'e-mail d'un compte %s : jamais modifié", async (role) => {
    fiches.push(nouvelleFiche("nouvelle@exemple.fr", { role }));
    const r = await traiterEvenement(paiementInitial(), deps());
    expect(r.action).toBe("ignore");
    expect(fiches[0]).toMatchObject({ role, statut_abonnement: "inactif", stripe_customer_id: null });
  });

  it("événement non suivi ou sans abonnement : ignoré", async () => {
    expect((await traiterEvenement({ id: "evt_x", type: "charge.refunded", data: { object: {} } }, deps())).action).toBe(
      "ignore",
    );
    const sansAbonnement = { id: "evt_y", type: "checkout.session.completed", data: { object: { customer: "cus_1" } } };
    expect((await traiterEvenement(sansAbonnement, deps())).action).toBe("ignore");
    expect(fiches).toEqual([]);
  });

  it("une erreur pendant le traitement ne marque pas l'événement comme traité (Stripe le renverra)", async () => {
    const d = deps();
    d.base.mettreAJour = async () => {
      throw new Error("base indisponible");
    };
    await expect(traiterEvenement(paiementInitial(), d)).rejects.toThrow(/indisponible/);
    expect(traites.size).toBe(0);
  });
});

describe("phrase « Mon abonnement »", async () => {
  const { descriptionAbonnement } = await import("@/lib/abonnement/textes");
  const maintenant = new Date("2027-01-10T10:00:00Z");
  const plusTard = "2027-02-10T10:00:00Z";
  const avant = "2027-01-01T10:00:00Z";
  it.each([
    [{ statut: "actif", fin: plusTard, annulationPrevue: false }, "Abonnement actif. Prochain prélèvement le 10 février 2027."],
    [{ statut: "actif", fin: plusTard, annulationPrevue: true }, "Résiliation prise en compte : tu gardes l'accès jusqu'au 10 février 2027."],
    [{ statut: "impaye", fin: plusTard, annulationPrevue: false }, "Le dernier paiement a échoué. Mets à jour ta carte : tu gardes l'accès jusqu'au 10 février 2027."],
    [{ statut: "impaye", fin: avant, annulationPrevue: false }, "Le dernier paiement a échoué. Mets à jour ta carte pour retrouver l'accès."],
    [{ statut: "resilie", fin: avant, annulationPrevue: false }, "Ton abonnement est terminé depuis le 1 janvier 2027."],
    [{ statut: "inactif", fin: null, annulationPrevue: false }, "Ton abonnement n'est pas encore actif."],
  ] as const)("%o", (a, phrase) => {
    expect(descriptionAbonnement(a, maintenant)).toBe(phrase);
  });
});
