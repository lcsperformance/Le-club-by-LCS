import { prochainEvenement, quandCourt } from "@/lib/agenda";
import { utilisateurConnecte } from "@/lib/auth";
import { lireEvenements } from "@/lib/club-serveur";
import { BandeauEvenement } from "./BandeauEvenement";

/** Lit l'agenda (membres connectés seulement, sécurité par ligne) et affiche le bandeau du prochain événement. */
export async function ProchainEvenement() {
  // Personne de connecté (pages publiques, aperçus) : on ne lit rien.
  if (!(await utilisateurConnecte())) return null;
  const evenements = await lireEvenements();
  // L'heure est lue après l'agenda (donnée de la session) : la page reste dynamique.
  const maintenant = new Date();
  const evenement = prochainEvenement(evenements, maintenant);
  if (!evenement) return null;
  return <BandeauEvenement evenement={{ type: evenement.type, titre: evenement.titre }} quand={quandCourt(evenement, maintenant)} />;
}
