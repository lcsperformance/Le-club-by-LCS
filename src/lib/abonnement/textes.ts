import { formatDateFr } from "@/lib/dates";
import type { StatutAbonnement } from "./etat";

type Abonnement = { statut: StatutAbonnement; fin: string | null; annulationPrevue: boolean };

/** Phrase affichée au membre selon l'état de son abonnement (carte « Mon abonnement »). */
export function descriptionAbonnement(a: Abonnement, maintenant: Date = new Date()): string {
  const fin = a.fin ? formatDateFr(new Date(a.fin)) : null;
  const termine = !a.fin || new Date(a.fin) <= maintenant;

  if (a.statut === "actif" && a.annulationPrevue && fin) {
    return `Résiliation prise en compte : tu gardes l'accès jusqu'au ${fin}.`;
  }
  if (a.statut === "actif" && fin) return `Abonnement actif. Prochain prélèvement le ${fin}.`;
  if (a.statut === "impaye" && fin && !termine) {
    return `Le dernier paiement a échoué. Mets à jour ta carte : tu gardes l'accès jusqu'au ${fin}.`;
  }
  if (a.statut === "impaye") return "Le dernier paiement a échoué. Mets à jour ta carte pour retrouver l'accès.";
  if (a.statut === "resilie" && fin && !termine) return `Abonnement résilié : tu gardes l'accès jusqu'au ${fin}.`;
  if (a.statut === "resilie" && fin) return `Ton abonnement est terminé depuis le ${fin}.`;
  return "Ton abonnement n'est pas encore actif.";
}
