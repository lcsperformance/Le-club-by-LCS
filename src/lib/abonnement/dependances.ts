import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { urlDuSite } from "@/lib/site";
import { configAbonnement } from "./config";
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
      abonnement: async (id) => (await stripe().subscriptions.retrieve(id)) as unknown as AbonnementStripe,
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
      mettreAJour: async (id, champs) => {
        const { error } = await base.from("membres").update(champs).eq("id", id);
        if (error) throw new Error(`Mise à jour de l'abonnement impossible : ${error.message}`);
      },
    },
    emails: {
      reabonnement: async (email) => {
        const cle = configAbonnement.cleResend();
        if (!cle) {
          console.warn("RESEND_API_KEY absente : e-mail de reprise non envoyé à un ancien membre.");
          return;
        }
        const r = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { authorization: `Bearer ${cle}`, "content-type": "application/json" },
          body: JSON.stringify({
            from: configAbonnement.expediteur,
            to: email,
            subject: "Bon retour au Club by LCS !",
            html: emailReprise(urlDuSite()),
          }),
        });
        // Un e-mail de courtoisie ne doit pas faire échouer le webhook.
        if (!r.ok) console.error("Envoi de l'e-mail de reprise impossible", r.status);
      },
    },
  };
}

function emailReprise(site: string) {
  return `<div style="background:#090A0F;padding:32px 24px;font-family:Helvetica,Arial,sans-serif;color:#F4EEFF">
  <p style="font-size:28px;font-weight:800;color:#DEFD62;margin:0 0 24px">le club</p>
  <p style="font-size:16px;line-height:1.5">Bonjour,</p>
  <p style="font-size:16px;line-height:1.5">Ton abonnement au Club by LCS est de nouveau actif. Tu gardes ton compte : connecte-toi avec ton adresse e-mail et ton mot de passe habituel.</p>
  <p style="margin:28px 0"><a href="${site}/connexion" style="background:#DEFD62;color:#090A0F;padding:14px 22px;border-radius:14px;font-weight:800;text-decoration:none;display:inline-block">Me connecter</a></p>
  <p style="font-size:14px;line-height:1.5;color:#B8B4D6">Mot de passe oublié ? Utilise le lien « Mot de passe oublié ? » sur l'écran de connexion.</p>
  <p style="font-size:14px;line-height:1.5;color:#B8B4D6">L'équipe LCS Performance</p>
</div>`;
}
