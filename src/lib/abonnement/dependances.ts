import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlDuSite } from "@/lib/site";
import { configAbonnement } from "./config";
import { emailDoublon, emailReprise } from "./emails";
import type { AbonnementStripe } from "./etat";
import { stripe } from "./stripe";
import type { Dependances, MembreConnu } from "./webhook";

const COLONNES = "id, email, role, statut_abonnement, stripe_subscription_id";

/** Branchement réel du webhook : Stripe, Supabase (clé secrète) et Resend. */
export function dependancesReelles(): Dependances {
  const base = createAdminClient();

  const unMembre = async (colonne: string, valeur: string): Promise<MembreConnu | null> => {
    const { data, error } = await base.from("membres").select(COLONNES).eq(colonne, valeur).maybeSingle();
    if (error) throw new Error(`Lecture du membre impossible : ${error.message}`);
    return data as MembreConnu | null;
  };

  return {
    stripe: {
      abonnement: async (id) =>
        (await stripe().subscriptions.retrieve(id, { expand: ["latest_invoice"] })) as unknown as AbonnementStripe,
      annulerEtRembourser: async (id) => {
        const s = stripe();
        const abonnement = await s.subscriptions.retrieve(id);
        if (abonnement.status !== "canceled") {
          await s.subscriptions.cancel(id, {}, { idempotencyKey: `doublon-annulation-${id}` });
        }
        const factures = await s.invoices.list({ subscription: id, status: "paid", limit: 20 });
        for (const facture of factures.data) {
          const paiements = await s.invoicePayments.list({ invoice: facture.id!, status: "paid" });
          for (const p of paiements.data) {
            const pi = p.payment.payment_intent;
            const intention = typeof pi === "string" ? pi : pi?.id;
            if (!intention) continue;
            await s.refunds
              .create({ payment_intent: intention, reason: "duplicate" }, { idempotencyKey: `doublon-remboursement-${intention}` })
              .catch((e: { code?: string }) => {
                if (e.code !== "charge_already_refunded") throw e;
              });
          }
        }
      },
      infoClient: async (id) => {
        const c = await stripe().customers.retrieve(id);
        if ("deleted" in c && c.deleted) return { email: null, nom: null };
        return { email: c.email ?? null, nom: c.name ?? null };
      },
    },
    base: {
      dejaTraite: async (id) => {
        const { data, error } = await base.from("stripe_evenements").select("id").eq("id", id).maybeSingle();
        if (error) throw new Error(`Lecture des événements impossible : ${error.message}`);
        return !!data;
      },
      marquerTraite: async (id, type) => {
        const { error } = await base.from("stripe_evenements").upsert({ id, type }, { onConflict: "id", ignoreDuplicates: true });
        if (error) throw new Error(`Enregistrement de l'événement impossible : ${error.message}`);
      },
      membreParClient: (id) => unMembre("stripe_customer_id", id),
      membreParEmail: (email) => unMembre("email", email),
      creerCompteEtInviter: async (email) => {
        // Envoie l'e-mail « Bienvenue au Club » (modèle Supabase, via Resend) avec le lien
        // pour choisir son mot de passe. La fiche membre est créée par la base (déclencheur).
        const { data, error } = await base.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${urlDuSite()}/auth/confirm`,
        });
        if (error) {
          if (error.code === "email_exists" || /already been registered/i.test(error.message)) {
            return { existeDeja: true as const };
          }
          throw new Error(`Création du compte impossible : ${error.message}`);
        }
        return { id: data.user.id };
      },
      definirPrenomSiVide: async (id, prenom) => {
        const { error } = await base.from("membres").update({ prenom }).eq("id", id).is("prenom", null);
        if (error) throw new Error(`Enregistrement du prénom impossible : ${error.message}`);
      },
      definirNomSiVide: async (id, nom) => {
        const { error } = await base.from("membres").update({ nom }).eq("id", id).is("nom", null);
        if (error) throw new Error(`Enregistrement du nom impossible : ${error.message}`);
      },
      mettreAJour: async (id, champs) => {
        const { error } = await base.from("membres").update(champs).eq("id", id);
        if (error) throw new Error(`Mise à jour de l'abonnement impossible : ${error.message}`);
      },
    },
    emails: {
      reabonnement: (email) =>
        envoyerEmail(email, "Bon retour au Club by LCS !", emailReprise(urlDuSite()), "e-mail de reprise"),
      doublonRembourse: (email, abonnementId) =>
        envoyerEmail(email, "Le Club by LCS : ton second paiement est remboursé", emailDoublon(urlDuSite()), "e-mail de doublon", {
          // Envoyé une seule fois, même si deux messages Stripe du même doublon arrivent en même temps.
          cle: `doublon-${abonnementId}`,
        }),
    },
  };
}

/** E-mail de courtoisie par Resend : un échec est noté mais ne fait jamais échouer le webhook. */
async function envoyerEmail(email: string, sujet: string, html: string, nom: string, options: { cle?: string } = {}) {
  const cle = configAbonnement.cleResend();
  if (!cle) {
    console.warn(`RESEND_API_KEY absente : ${nom} non envoyé.`);
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${cle}`,
      "content-type": "application/json",
      ...(options.cle ? { "idempotency-key": options.cle } : {}),
    },
    body: JSON.stringify({ from: configAbonnement.expediteur, to: email, subject: sujet, html }),
  }).catch((e: unknown) => ({ ok: false, status: String(e) }) as const);
  if (!r.ok) console.error(`Envoi impossible (${nom})`, r.status);
}
