import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { aAcces, type StatutAbonnement } from "@/lib/abonnement/etat";
import type { Formule } from "@/lib/abonnement/formules";
import { doitAccepter } from "@/lib/legal";
import { estSessionDeReinitialisation } from "@/lib/reinitialisation";
import type { Niveau, Profil } from "@/lib/profils";
import { cheminAccueil, type Role } from "@/lib/roles";

export type Utilisateur = {
  id: string;
  email: string;
  /** Prénom (récupéré au paiement ou saisi dans le Profil) ; null s'il n'est pas connu. */
  prenom: string | null;
  /** Nom de famille (récupéré au paiement ou saisi dans le Profil) ; null s'il n'est pas connu. */
  nom: string | null;
  role: Role;
  /** Admin présenté comme « Coach » aux membres (Coach + admin). */
  afficheCoach: boolean;
  /** Version des CGV et de la politique acceptées (null : jamais acceptées). */
  conditionsAcceptees: string | null;
  /** Choisis par le membre ; null tant qu'il ne l'a pas fait. */
  niveau: Niveau | null;
  profil: Profil | null;
  /** Date d'inscription (ISO) : on peut remonter jusqu'à cette semaine dans Ma semaine. */
  dateInscription: string | null;
  abonnement: {
    statut: StatutAbonnement;
    /** Fin de la période payée (ISO) : accès ouvert jusqu'à cette date. */
    fin: string | null;
    annulationPrevue: boolean;
    /** Mensuelle ou annuelle ; null tant qu'aucun abonnement n'a été pris. */
    formule: Formule | null;
    /** Accès offert à la main par l'admin jusqu'à cette date (ISO), ou null. */
    offertJusqua: string | null;
    /** Accès coupé par l'admin. */
    coupe: boolean;
    /** A un compte client Stripe (peut ouvrir le portail pour gérer son abonnement). */
    clientStripe: boolean;
  };
};

/**
 * Personne connectée, ou null.
 * `cache` : lue une seule fois par requête, même si plusieurs composants la demandent.
 */
export const utilisateurConnecte = cache(async function utilisateurConnecte(): Promise<Utilisateur | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: membre } = await supabase
    .from("membres")
    .select("email, prenom, nom, role, affiche_coach, conditions_version, niveau, profil, statut_abonnement, abonnement_fin, annulation_prevue, formule, stripe_customer_id, acces_offert_jusqua, acces_coupe, date_inscription")
    .eq("id", id)
    .maybeSingle();
  if (!membre) return null;

  return {
    id,
    email: membre.email as string,
    prenom: (membre.prenom as string | null) ?? null,
    nom: (membre.nom as string | null) ?? null,
    role: membre.role as Role,
    afficheCoach: membre.affiche_coach === true,
    conditionsAcceptees: (membre.conditions_version as string | null) ?? null,
    niveau: (membre.niveau as Niveau | null) ?? null,
    profil: (membre.profil as Profil | null) ?? null,
    dateInscription: (membre.date_inscription as string | null) ?? null,
    abonnement: {
      statut: membre.statut_abonnement as StatutAbonnement,
      fin: (membre.abonnement_fin as string | null) ?? null,
      annulationPrevue: !!membre.annulation_prevue,
      formule: (membre.formule as Formule | null) ?? null,
      clientStripe: !!membre.stripe_customer_id,
      offertJusqua: (membre.acces_offert_jusqua as string | null) ?? null,
      coupe: !!membre.acces_coupe,
    },
  };
});

/** Vrai si la session vient d'un lien « mot de passe oublié » utilisé il y a moins de 15 minutes. */
export async function peutChoisirNouveauMotDePasse(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return estSessionDeReinitialisation(data?.claims?.amr);
}

/** Vrai si la personne peut utiliser l'espace membre (abonnement en cours, ou équipe du Club). */
export const aAccesEspace = (u: Utilisateur, maintenant = new Date()) =>
  aAcces(
    {
      role: u.role,
      abonnement_fin: u.abonnement.fin,
      acces_offert_jusqua: u.abonnement.offertJusqua,
      acces_coupe: u.abonnement.coupe,
    },
    maintenant,
  );

/**
 * À appeler en tête d'une page protégée : renvoie vers la bonne page sinon.
 * Un membre dont la période payée est terminée est renvoyé vers /abonnement.
 */
export async function exigerRole(...autorises: Role[]): Promise<Utilisateur> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  if (!autorises.includes(utilisateur.role)) redirect(cheminAccueil(utilisateur.role));
  // Première connexion (ou nouvelle version des textes) : accepter les CGV et la politique de confidentialité.
  if (doitAccepter(utilisateur)) redirect("/conditions");
  if (!aAccesEspace(utilisateur)) redirect("/abonnement");
  return utilisateur;
}

/** Page ouverte à toute personne connectée, même sans abonnement en cours (page /abonnement). */
export async function exigerConnexion(): Promise<Utilisateur> {
  const utilisateur = await utilisateurConnecte();
  if (!utilisateur) redirect("/connexion");
  return utilisateur;
}
