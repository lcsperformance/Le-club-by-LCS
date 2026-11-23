import { EnTeteMembre } from "@/components/EnTeteMembre";
import type { Evenement } from "@/lib/agenda";
import type { Utilisateur } from "@/lib/auth";
import { OngletsClub } from "../EcranClub";
import { AgendaClub } from "./AgendaClub";

/** Agenda du Club : calendrier mensuel et événements (FAQ en visio, webinaires…), à l'heure de Paris. */
export function EcranAgenda({ utilisateur, evenements, aujourdhui }: { utilisateur: Utilisateur; evenements: Evenement[]; aujourdhui: string }) {
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Le Club" />
      <OngletsClub actif="agenda" />
      <AgendaClub evenements={evenements} aujourdhui={aujourdhui} moisInitial={aujourdhui.slice(0, 7)} />
      <div style={{ height: 8 }} />
    </>
  );
}
