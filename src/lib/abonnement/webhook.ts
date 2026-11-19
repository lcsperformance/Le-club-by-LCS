/**
 * Traitement des événements Stripe (webhook), indépendant de Stripe et de Supabase :
 * les accès extérieurs sont fournis en paramètre, pour être testés sans réseau.
 *
 * Principes :
 * - on relit toujours l'abonnement chez Stripe : l'ordre d'arrivée des événements n'a pas d'importance ;
 * - un événement déjà traité est ignoré (webhook reçu deux fois) ;
 * - chaque traitement peut être rejoué sans effet en double.
 */
import { prenomDepuisNom } from "../prenom";
import { formuleDepuisAbonnement, type Formule } from "./formules";
import { estPaye, etatDepuisAbonnement, type AbonnementStripe, type EtatAbonnement } from "./etat";

export const EVENEMENTS_SUIVIS = [
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

export type EvenementStripe = { id: string; type: string; data: { object: Record<string, unknown> } };

export type MembreConnu = {
  id: string;
  email: string;
  role: string;
  statut_abonnement: string;
  stripe_subscription_id: string | null;
};

export type Dependances = {
  stripe: {
    abonnement(id: string): Promise<AbonnementStripe>;
    /** E-mail et nom du client Stripe (nom du titulaire, pour le prénom). */
    infoClient(id: string): Promise<{ email: string | null; nom: string | null }>;
    /** Doublon : annule l'abonnement tout de suite et rembourse ce qu'il a prélevé (sans effet s'il est rejoué). */
    annulerEtRembourser(abonnementId: string): Promise<void>;
  };
  base: {
    dejaTraite(evenementId: string): Promise<boolean>;
    marquerTraite(evenementId: string, type: string): Promise<void>;
    membreParClient(clientId: string): Promise<MembreConnu | null>;
    membreParEmail(email: string): Promise<MembreConnu | null>;
    /** Crée le compte et envoie l'e-mail de bienvenue (lien pour choisir son mot de passe). */
    creerCompteEtInviter(email: string): Promise<{ id: string } | { existeDeja: true }>;
    mettreAJour(
      membreId: string,
      champs: {
        stripe_customer_id: string;
        stripe_subscription_id: string;
        statut_abonnement: string;
        abonnement_fin: string | null;
        annulation_prevue: boolean;
        formule: Formule | null;
      },
    ): Promise<void>;
    /** Enregistre le prénom seulement s'il est encore vide (jamais d'écrasement d'un prénom corrigé). */
    definirPrenomSiVide(membreId: string, prenom: string): Promise<void>;
  };
  emails: {
    /** Ancien membre qui se réabonne : il a déjà ses identifiants. */
    reabonnement(email: string): Promise<void>;
  };
};

export type Resultat =
  | { action: "ignore"; raison: string }
  | { action: "deja-traite" }
  | { action: "compte-cree"; membreId: string; etat: EtatAbonnement }
  | { action: "reabonnement"; membreId: string; etat: EtatAbonnement }
  | { action: "mis-a-jour"; membreId: string; etat: EtatAbonnement }
  | { action: "doublon-rembourse"; membreId: string; abonnementId: string };

const texte = (v: unknown) => (typeof v === "string" && v ? v : null);
const id = (v: unknown) => texte(v) ?? texte((v as { id?: unknown } | null)?.id);

/** Abonnement, client et e-mail concernés par l'événement. */
export function lireEvenement(evenement: EvenementStripe) {
  const o = evenement.data.object;
  switch (evenement.type) {
    case "checkout.session.completed":
      return {
        abonnementId: id(o.subscription),
        clientId: id(o.customer),
        email: texte((o.customer_details as { email?: unknown } | null)?.email),
        nom: texte((o.customer_details as { name?: unknown } | null)?.name),
      };
    case "invoice.paid":
    case "invoice.payment_failed": {
      const parent = o.parent as { subscription_details?: { subscription?: unknown } } | null;
      return {
        abonnementId: id(parent?.subscription_details?.subscription) ?? id(o.subscription),
        clientId: id(o.customer),
        email: texte(o.customer_email),
        nom: texte(o.customer_name),
      };
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return { abonnementId: id(o.id), clientId: id(o.customer), email: null, nom: null };
    default:
      return { abonnementId: null, clientId: null, email: null, nom: null };
  }
}

const normaliser = (email: string) => email.trim().toLowerCase();

export async function traiterEvenement(evenement: EvenementStripe, d: Dependances): Promise<Resultat> {
  if (!(EVENEMENTS_SUIVIS as readonly string[]).includes(evenement.type)) {
    return { action: "ignore", raison: `événement ${evenement.type} non suivi` };
  }
  if (await d.base.dejaTraite(evenement.id)) return { action: "deja-traite" };

  const resultat = await appliquer(evenement, d);
  await d.base.marquerTraite(evenement.id, evenement.type);
  return resultat;
}

async function appliquer(evenement: EvenementStripe, d: Dependances): Promise<Resultat> {
  const { abonnementId, clientId, email: emailEvenement, nom: nomEvenement } = lireEvenement(evenement);
  if (!abonnementId || !clientId) return { action: "ignore", raison: "pas d'abonnement concerné" };

  // État réel, relu chez Stripe (et non celui, peut-être ancien, porté par l'événement).
  const abonnementStripe = await d.stripe.abonnement(abonnementId);
  const etat = etatDepuisAbonnement(abonnementStripe);

  let membre = await d.base.membreParClient(clientId);
  // Infos du client Stripe, lues seulement si l'événement ne les porte pas.
  const client = !nomEvenement || (!membre && !emailEvenement) ? await d.stripe.infoClient(clientId) : null;
  const email = emailEvenement ?? (membre ? null : client?.email ?? null);
  const nom = nomEvenement ?? client?.nom ?? null;
  if (!membre && email) membre = await d.base.membreParEmail(normaliser(email));

  let cree = false; // compte créé par ce traitement
  let nouveauCompte = false; // compte tout juste créé (par ce traitement ou un autre en parallèle)
  if (!membre) {
    if (!estPaye(etat)) return { action: "ignore", raison: "aucun compte et abonnement non payé" };
    if (!email) throw new Error(`Aucun e-mail pour le client Stripe ${clientId}`);
    const r = await d.base.creerCompteEtInviter(normaliser(email));
    if ("existeDeja" in r) {
      // Compte créé entre-temps (autre événement traité en même temps) : on le reprend.
      membre = await d.base.membreParEmail(normaliser(email));
      if (!membre) throw new Error(`Compte ${email} introuvable après création`);
      nouveauCompte = true;
    } else {
      membre = {
        id: r.id,
        email: normaliser(email),
        role: "membre",
        statut_abonnement: "inactif",
        stripe_subscription_id: null,
      };
      cree = true;
      nouveauCompte = true;
    }
  }

  // Les comptes de l'équipe (coach, admin) ne sont jamais modifiés par un paiement.
  if (membre.role !== "membre") return { action: "ignore", raison: `compte ${membre.role} non modifié` };

  // Événement d'un AUTRE abonnement, terminé ou impayé (ancien abonnement, message renvoyé en retard
  // par Stripe…) : il ne remplace jamais l'abonnement en cours du membre. Seul un nouvel abonnement
  // payé prend la place de l'ancien (réabonnement).
  if (membre.stripe_subscription_id && membre.stripe_subscription_id !== abonnementId && !estPaye(etat)) {
    return { action: "ignore", raison: "ancien abonnement, différent de l'abonnement en cours" };
  }

  // Doublon : la personne a déjà un abonnement en cours (actif, sans résiliation prévue) et en paie
  // un second (même adresse, nouveau passage sur le lien de paiement). On garde le premier, on annule
  // et rembourse le second : jamais deux prélèvements. Rejoué, l'abonnement annulé est ignoré plus haut.
  if (membre.stripe_subscription_id && membre.stripe_subscription_id !== abonnementId) {
    const actuel = etatDepuisAbonnement(await d.stripe.abonnement(membre.stripe_subscription_id));
    if (actuel.statut === "actif" && !actuel.annulationPrevue) {
      await d.stripe.annulerEtRembourser(abonnementId);
      return { action: "doublon-rembourse", membreId: membre.id, abonnementId };
    }
  }

  // Compte déjà existant qui prend un NOUVEL abonnement (ancien membre, compte créé à la main…) :
  // on le prévient une seule fois, quel que soit l'ordre des événements, car le premier
  // traitement enregistre le nouvel abonnement.
  const reprise = !nouveauCompte && estPaye(etat) && membre.stripe_subscription_id !== abonnementId;
  await d.base.mettreAJour(membre.id, {
    stripe_customer_id: clientId,
    stripe_subscription_id: abonnementId,
    statut_abonnement: etat.statut,
    abonnement_fin: etat.fin,
    annulation_prevue: etat.annulationPrevue,
    formule: formuleDepuisAbonnement(abonnementStripe),
  });

  const prenom = prenomDepuisNom(nom);
  if (prenom) await d.base.definirPrenomSiVide(membre.id, prenom);

  if (cree) return { action: "compte-cree", membreId: membre.id, etat };
  if (reprise) {
    await d.emails.reabonnement(membre.email);
    return { action: "reabonnement", membreId: membre.id, etat };
  }
  return { action: "mis-a-jour", membreId: membre.id, etat };
}
