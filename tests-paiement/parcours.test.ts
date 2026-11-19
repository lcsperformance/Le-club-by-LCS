/**
 * Parcours de paiement complet, de bout en bout, avec les faux paiements de Stripe (mode test) :
 * Stripe → webhook du site en ligne → base Supabase en ligne.
 *
 *   npm run test:paiement
 *
 * Ne tourne pas dans les vérifications GitHub (touche au site en ligne). Tout ce qui est créé
 * (clients, abonnements, comptes) est supprimé à la fin, même en cas d'échec.
 * Les adresses @resend.dev sont des adresses de test de Resend : aucun vrai destinataire.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  abonner,
  attendre,
  avancer,
  base,
  CARTES,
  client,
  evenements,
  fiches,
  finDePeriode,
  horloge,
  nettoyer,
  patienter,
  stripe,
  verifierConfiguration,
  WEBHOOK,
  type Fiche,
} from "./aide";

const ESSAI = Date.now().toString(36);
const PREFIXE = `delivered+paiement-${ESSAI}`;
const email = (cas: string) => `${PREFIXE}-${cas}@resend.dev`;
const dateBase = (v: string | null) => (v ? new Date(v).toISOString() : null);
const MAINTENANT = Math.floor(Date.now() / 1000);
const horloges: string[] = [];

const unSeul = (email: string, ok: (f: Fiche) => boolean = () => true) =>
  attendre(
    () => fiches(email),
    (l) => l.length === 1 && ok(l[0]),
  );

beforeAll(() => verifierConfiguration());
afterAll(async () => {
  await nettoyer(horloges, PREFIXE);
}, 120_000);

// ---------------------------------------------------------------------------
describe("1. inscription", () => {
  const adresse = email("inscription");
  let h: string;
  let abonnement: Record<string, unknown> & { id: string };
  let second: Record<string, unknown> & { id: string };
  let fiche: Fiche;

  it("un paiement réussi crée le compte, actif jusqu'à la fin du mois payé, et envoie l'e-mail de bienvenue", async () => {
    h = await horloge(MAINTENANT, `paiement ${ESSAI} inscription`);
    horloges.push(h);
    const c = await client(h, adresse, CARTES.acceptee);
    abonnement = await abonner(c.client);
    expect(abonnement.status).toBe("active");

    [fiche] = await unSeul(adresse, (f) => f.statut_abonnement === "actif");
    expect(fiche).toMatchObject({
      statut_abonnement: "actif",
      formule: "mensuelle",
      stripe_customer_id: c.client,
      stripe_subscription_id: abonnement.id,
      prenom: "Camille",
      acces: true,
    });
    expect(dateBase(fiche.abonnement_fin)).toBe(new Date(finDePeriode(abonnement) * 1000).toISOString());
    expect(fiche.invited_at).not.toBeNull(); // e-mail de bienvenue (lien pour choisir son mot de passe)
  });

  it("webhook reçu deux fois : Stripe renvoie le même message signé, il est ignoré (pas de second e-mail)", async () => {
    const [paiement] = await evenements("invoice.paid", abonnement.id);
    expect(paiement).toBeDefined();
    const avant = await fiches(adresse);
    await stripe("POST", `events/${paiement.id}/retry`, { webhook_endpoint: WEBHOOK });
    await patienter(12_000);
    expect(await fiches(adresse)).toEqual(avant); // même fiche, même date d'envoi de l'e-mail
    const traces = await base(`select id from public.stripe_evenements where id = '${paiement.id}'`);
    expect(traces).toHaveLength(1);
  });

  it("doublon : la même adresse paie une seconde fois → toujours un seul compte, le premier abonnement gardé", async () => {
    const c2 = await client(h, adresse, CARTES.acceptee);
    second = await abonner(c2.client);
    expect(second.status).toBe("active");
    // Le webhook repère le doublon et l'annule.
    const annule = await attendre(
      () => stripe("GET", `subscriptions/${second.id}`),
      (a) => a.status === "canceled",
    );
    expect(annule.status, "second abonnement annulé").toBe("canceled");
    const liste = await fiches(adresse);
    expect(liste).toHaveLength(1);
    expect(liste[0]).toMatchObject({ id: fiche.id, statut_abonnement: "actif", stripe_subscription_id: abonnement.id });
    expect(liste[0].invited_at).toBe(fiche.invited_at); // pas de nouvel e-mail de bienvenue
  });

  it("doublon : la même personne n'est pas prélevée deux fois (second paiement remboursé)", async () => {
    const actifs = await stripe("GET", "subscriptions", { status: "active", test_clock: h, limit: 10 });
    expect((actifs.data as { id: string }[]).map((a) => a.id), "un seul abonnement actif").toEqual([abonnement.id]);
    const rembourse = await attendre(
      () => stripe("GET", "charges", { customer: second.customer as string, limit: 5 }),
      (l) => (l.data as { refunded: boolean }[]).every((c) => c.refunded),
    );
    const paiements = rembourse.data as { amount: number; amount_refunded: number; refunded: boolean }[];
    expect(paiements).toHaveLength(1);
    expect(paiements[0]).toMatchObject({ refunded: true, amount_refunded: paiements[0].amount });
  });
});

// ---------------------------------------------------------------------------
describe("2. paiement refusé (cartes 4000 0000 0000 0002 et 0341)", () => {
  let h: string;

  it("au premier paiement : carte refusée dès la saisie, aucun abonnement, aucun compte", async () => {
    h = await horloge(MAINTENANT, `paiement ${ESSAI} refus`);
    horloges.push(h);
    const adresse = email("refus-initial");
    const c = await stripe("POST", "customers", { email: adresse, name: "Camille Martin", test_clock: h });
    const refus = await stripe("POST", `payment_methods/${CARTES.refusee}/attach`, { customer: c.id }).catch(
      (e: { code?: string }) => e,
    );
    expect("code" in refus && refus.code).toBe("card_declined");
    const essai = await abonner(c.id).catch((e: { code?: string }) => e);
    expect("id" in essai, "aucun abonnement sans carte valide").toBe(false);
    await patienter(15_000);
    expect(await fiches(adresse)).toHaveLength(0);
  });

  it("au renouvellement : « impayé », l'accès reste ouvert jusqu'à la fin du mois déjà payé, pas au-delà", async () => {
    const adresse = email("refus-renouvellement");
    const c = await client(h, adresse, CARTES.acceptee);
    const abonnement = await abonner(c.client);
    const finPayee = finDePeriode(abonnement);
    await unSeul(adresse, (f) => f.statut_abonnement === "actif");

    // La carte est remplacée par une carte qui sera refusée au prélèvement, puis on avance d'un mois.
    const refusee = await stripe("POST", `payment_methods/${CARTES.refuseePlusTard}/attach`, { customer: c.client });
    await stripe("POST", `customers/${c.client}`, { "invoice_settings[default_payment_method]": refusee.id });
    await avancer(h, finPayee + 3600);
    const apres = await stripe("GET", `subscriptions/${abonnement.id}`);
    expect(apres.status).toBe("past_due");

    const [f] = await unSeul(adresse, (x) => x.statut_abonnement === "impaye");
    expect(f.statut_abonnement).toBe("impaye");
    expect(dateBase(f.abonnement_fin), "fin d'accès = fin de la période réellement payée").toBe(
      new Date(finPayee * 1000).toISOString(),
    );
  });
});

// ---------------------------------------------------------------------------
describe("3. résiliation et réactivation", () => {
  const adresse = email("resiliation");
  let h: string;
  let abonnement: Record<string, unknown> & { id: string };
  let finPayee: number;
  let fiche: Fiche;

  it("résiliation demandée : toujours actif jusqu'à la fin de la période, résiliation prévue", async () => {
    // Horloge démarrée un mois moins 3 minutes plus tôt : la période payée se termine dans 3 minutes.
    const depart = new Date(MAINTENANT * 1000);
    depart.setUTCMonth(depart.getUTCMonth() - 1);
    h = await horloge(Math.floor(depart.getTime() / 1000) + 180, `paiement ${ESSAI} resiliation`);
    horloges.push(h);
    const c = await client(h, adresse, CARTES.acceptee);
    abonnement = await abonner(c.client);
    finPayee = finDePeriode(abonnement);
    [fiche] = await unSeul(adresse, (f) => f.statut_abonnement === "actif");

    await stripe("POST", `subscriptions/${abonnement.id}`, { cancel_at_period_end: true });
    const [f] = await unSeul(adresse, (x) => x.annulation_prevue);
    expect(f).toMatchObject({ statut_abonnement: "actif", annulation_prevue: true, acces: true });
    expect(dateBase(f.abonnement_fin)).toBe(new Date(finPayee * 1000).toISOString());
  });

  it("réactivation avant la fin : le membre annule sa résiliation", async () => {
    await stripe("POST", `subscriptions/${abonnement.id}`, { cancel_at_period_end: false });
    const [f] = await unSeul(adresse, (x) => !x.annulation_prevue);
    expect(f).toMatchObject({ statut_abonnement: "actif", annulation_prevue: false, acces: true });
  });

  it("fin de la période : « résilié », puis accès fermé une fois la date passée (aucun nouveau prélèvement)", async () => {
    await stripe("POST", `subscriptions/${abonnement.id}`, { cancel_at_period_end: true });
    await unSeul(adresse, (x) => x.annulation_prevue);
    await avancer(h, finPayee + 60);
    expect((await stripe("GET", `subscriptions/${abonnement.id}`)).status).toBe("canceled");

    const [f] = await unSeul(adresse, (x) => x.statut_abonnement === "resilie");
    expect(f.statut_abonnement).toBe("resilie");
    expect(dateBase(f.abonnement_fin)).toBe(new Date(finPayee * 1000).toISOString());
    const factures = await stripe("GET", "invoices", { subscription: abonnement.id });
    expect((factures.data as unknown[]).length).toBe(1);

    // Attente réelle jusqu'à la fin de la période payée (3 minutes au plus).
    const [ferme] = await attendre(() => fiches(adresse), (l) => !l[0].acces, 240_000);
    expect(ferme.acces).toBe(false);
  }, 360_000);

  it("réabonnement après la fin : même compte réactivé, sans nouvel e-mail de bienvenue", async () => {
    const c2 = await client(h, adresse, CARTES.acceptee);
    const nouveau = await abonner(c2.client);
    const [f] = await unSeul(adresse, (x) => x.statut_abonnement === "actif");
    expect(f).toMatchObject({
      id: fiche.id,
      statut_abonnement: "actif",
      stripe_subscription_id: nouveau.id,
      annulation_prevue: false,
      acces: true,
      invited_at: fiche.invited_at,
    });
    // L'e-mail « Bon retour » part par Resend : non vérifiable ici (voir le tableau de bord Resend).
  });
});
