import { CarteDecompte } from "@/components/CarteDecompte";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { Carte } from "@/components/ui";
import type { Utilisateur } from "@/lib/auth";
import { organiserSaison, phaseDuMoment, type Objectif } from "@/lib/saison";

/** Ma semaine : phase du moment (fil rouge ou bloc) et décompte jusqu'au prochain objectif. */
export function EcranSemaine({ utilisateur, objectifs, aujourdhui }: { utilisateur: Utilisateur; objectifs: Objectif[]; aujourdhui: string }) {
  const saison = organiserSaison(objectifs, aujourdhui);
  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Ma semaine" sousTitre={phaseDuMoment(saison)} />
      <CarteDecompte prochain={saison.prochain} href="/saison" />
      <Carte as="section">
        <p className="message-info">Tes séances de la semaine apparaîtront ici.</p>
      </Carte>
    </>
  );
}
