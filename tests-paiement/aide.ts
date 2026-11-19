/**
 * Outils des tests du parcours de paiement : Stripe (mode test uniquement), base Supabase en ligne
 * (API de gestion, lecture et nettoyage), attente des webhooks.
 *
 * Variables : STRIPE_SECRET_KEY (sk_test_…), SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN.
 */

const CLE = process.env.STRIPE_SECRET_KEY ?? "";
const REF = process.env.SUPABASE_PROJECT_REF ?? "";
const JETON = process.env.SUPABASE_ACCESS_TOKEN ?? "";

export const PRIX = {
  mensuelle: "price_1UdWF4B1uelR3FW9twzNAWsJ",
  annuelle: "price_1UdWFrB1uelR3FW9WJ9BeU8T",
};
export const WEBHOOK = "we_1UdWaCB1uelR3FW9GFPiJTvJ";

/** Cartes de test Stripe (moyens de paiement prêts à l'emploi). */
export const CARTES = {
  acceptee: "pm_card_visa", // 4242 4242 4242 4242
  refusee: "pm_card_chargeDeclined", // 4000 0000 0000 0002 : refusée dès qu'on la saisit
  refuseePlusTard: "pm_card_chargeCustomerFail", // 4000 0000 0000 0341 : acceptée à l'enregistrement, refusée au prélèvement
};

export function verifierConfiguration() {
  if (CLE.startsWith("sk_live_") || CLE.startsWith("rk_live_")) {
    throw new Error("Clé Stripe LIVE : ces tests ne tournent qu'en mode test.");
  }
  if (!CLE || !REF || !JETON) {
    throw new Error("Renseigne STRIPE_SECRET_KEY (sk_test_…), SUPABASE_PROJECT_REF et SUPABASE_ACCESS_TOKEN.");
  }
}

type Objet = Record<string, unknown> & { id: string };

/** Appel à l'API Stripe ; refuse tout objet en mode réel (livemode). */
export async function stripe(methode: "GET" | "POST" | "DELETE", chemin: string, params: Record<string, string | number | boolean> = {}) {
  const corps = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `https://api.stripe.com/v1/${chemin}${methode === "GET" && corps.size ? `?${corps}` : ""}`;
  const r = await fetch(url, {
    method: methode,
    headers: {
      authorization: `Basic ${Buffer.from(`${CLE}:`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: methode === "GET" ? undefined : corps,
  });
  const d = (await r.json()) as Objet & { error?: { message: string; code?: string }; livemode?: boolean };
  if (d.livemode === true) throw new Error("Objet Stripe en mode réel : arrêt immédiat.");
  if (!r.ok) throw Object.assign(new Error(`Stripe ${chemin} : ${d.error?.message}`), { code: d.error?.code, corps: d });
  return d;
}

const sql = (t: string) => `'${t.replaceAll("'", "''")}'`;

/** Requête SQL sur la base en ligne (API de gestion Supabase). */
export async function base<T = Record<string, unknown>>(requete: string): Promise<T[]> {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${JETON}` },
    body: JSON.stringify({ query: requete }),
  });
  const corps = await r.json();
  if (!r.ok) throw new Error(`Supabase : ${corps.message ?? r.status}`);
  return corps as T[];
}

export type Fiche = {
  id: string;
  email: string;
  statut_abonnement: string;
  formule: string | null;
  abonnement_fin: string | null;
  annulation_prevue: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  prenom: string | null;
  invited_at: string | null;
  acces: boolean;
};

/** Fiches membre d'une adresse (normalement 0 ou 1), avec la date d'envoi de l'e-mail de bienvenue. */
export const fiches = (email: string) =>
  base<Fiche>(
    `select m.id, m.email, m.statut_abonnement, m.formule, m.abonnement_fin, m.annulation_prevue,
            m.stripe_customer_id, m.stripe_subscription_id, m.prenom, u.invited_at,
            coalesce(m.abonnement_fin > now(), false) as acces
       from public.membres m join auth.users u on u.id = m.id
      where lower(m.email) = lower(${sql(email)})`,
  );

/** Attend qu'une condition soit vraie (le webhook met quelques secondes). Renvoie la dernière valeur lue. */
export async function attendre<T>(lire: () => Promise<T>, ok: (v: T) => boolean, delai = 45_000): Promise<T> {
  const fin = Date.now() + delai;
  let v = await lire();
  while (!ok(v) && Date.now() < fin) {
    await new Promise((r) => setTimeout(r, 2_000));
    v = await lire();
  }
  return v;
}

/** Laisse le temps au webhook de (ne pas) agir, pour vérifier que rien ne se passe. */
export const patienter = (ms = 15_000) => new Promise((r) => setTimeout(r, ms));

/** Horloge de test Stripe : permet d'avancer d'un mois en quelques secondes. */
export async function horloge(depart: number, nom: string) {
  const h = await stripe("POST", "test_helpers/test_clocks", { frozen_time: depart, name: nom });
  return h.id;
}

export async function avancer(horlogeId: string, jusqua: number) {
  await stripe("POST", `test_helpers/test_clocks/${horlogeId}/advance`, { frozen_time: jusqua });
  const pret = await attendre(
    () => stripe("GET", `test_helpers/test_clocks/${horlogeId}`),
    (h) => h.status === "ready",
    120_000,
  );
  if (pret.status !== "ready") throw new Error(`Horloge ${horlogeId} : ${pret.status}`);
}

/** Client Stripe avec une carte, comme après un passage sur la page de paiement. */
export async function client(horlogeId: string, email: string, carte: string, nom = "Camille Martin") {
  const c = await stripe("POST", "customers", { email, name: nom, test_clock: horlogeId });
  const pm = await stripe("POST", `payment_methods/${carte}/attach`, { customer: c.id });
  await stripe("POST", `customers/${c.id}`, { "invoice_settings[default_payment_method]": pm.id });
  return { client: c.id, carte: pm.id };
}

/** Abonnement payé tout de suite (ou refusé). */
export const abonner = (clientId: string, prix = PRIX.mensuelle) =>
  stripe("POST", "subscriptions", { customer: clientId, "items[0][price]": prix });

/** Fin de période d'un abonnement Stripe (secondes). */
export const finDePeriode = (abonnement: Record<string, unknown>) =>
  (abonnement.items as { data: { current_period_end: number }[] }).data[0].current_period_end;

/** Derniers événements Stripe d'un type pour un objet (client, abonnement…). */
export async function evenements(type: string, objetId: string) {
  const liste = await stripe("GET", "events", { type, limit: 50 });
  return (liste.data as { id: string; data: { object: Record<string, unknown> } }[]).filter((e) =>
    [e.data.object.id, e.data.object.customer, e.data.object.subscription].includes(objetId),
  );
}

/** Nettoyage : horloges (et donc clients et abonnements de test), puis comptes de test. */
export async function nettoyer(horloges: string[], prefixeEmail: string) {
  for (const h of horloges) await stripe("DELETE", `test_helpers/test_clocks/${h}`).catch(() => undefined);
  await base(`delete from auth.users where email like ${sql(`${prefixeEmail}%`)}`);
}
