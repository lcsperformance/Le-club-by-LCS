import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilMembre } from "@/app/(membre)/accueil/AccueilMembre";
import { EcranAbonnement } from "@/app/(membre)/abonnement/EcranAbonnement";
import { EcranProfil } from "@/app/(membre)/profil/EcranProfil";
import { EcranSaison } from "@/app/(membre)/saison/EcranSaison";
import { EcranSemaine } from "@/app/(membre)/semaine/EcranSemaine";
import { EcranBientot } from "@/components/EcranBientot";
import { EnTeteTests } from "@/app/(membre)/tests/EnTeteTests";
import { FormulaireTests } from "@/app/(membre)/tests/FormulaireTests";
import { AffichageZones } from "@/app/(membre)/zones/AffichageZones";
import { EnTeteZones } from "@/app/(membre)/zones/EnTeteZones";
import {
  AUJOURDHUI_FICTIF,
  exigerApercu,
  OBJECTIFS_EN_COURS_FICTIFS,
  OBJECTIFS_FICTIFS,
  TEST_FICTIF,
  UTILISATEUR_FICTIF,
} from "@/lib/apercu";
import { valeursDeDepart } from "@/lib/tests-depart";
import { SPORTS } from "@/lib/zones";

/** Aperçus des écrans membre (mode test uniquement). */
export default function ApercuMembre({ params }: PageProps<"/apercu-membre/[ecran]">) {
  return (
    <Suspense fallback={null}>
      <Ecran params={params} />
    </Suspense>
  );
}

async function Ecran({ params }: Pick<PageProps<"/apercu-membre/[ecran]">, "params">) {
  await exigerApercu();
  const { ecran } = await params;
  switch (ecran) {
    case "accueil":
      return <AccueilMembre utilisateur={UTILISATEUR_FICTIF} testsFaits={false} aujourdhui={new Date()} />;
    case "accueil-sans-prenom":
      return <AccueilMembre utilisateur={{ ...UTILISATEUR_FICTIF, prenom: null }} testsFaits aujourdhui={new Date()} />;
    case "accueil-tests-faits":
      return <AccueilMembre utilisateur={UTILISATEUR_FICTIF} testsFaits aujourdhui={new Date()} />;
    case "tests":
      return (
        <>
          <EnTeteTests />
          <FormulaireTests valeursInitiales={valeursDeDepart(null)} />
        </>
      );
    case "profil":
      return (
        <EcranProfil
          utilisateur={{ ...UTILISATEUR_FICTIF, niveau: "challenger", profil: "extensif" }}
          maintenant={new Date("2027-01-10T10:00:00Z")}
        />
      );
    case "abonnement-termine":
      return (
        <EcranAbonnement
          utilisateur={{
            ...UTILISATEUR_FICTIF,
            abonnement: { statut: "resilie", fin: "2027-01-01T10:00:00.000Z", annulationPrevue: false, formule: "mensuelle", clientStripe: true, offertJusqua: null, coupe: false },
          }}
          liensPaiement={{ mensuelle: "https://buy.stripe.com/test_exemple", annuelle: "https://buy.stripe.com/test_annuel" }}
          maintenant={new Date("2027-01-10T10:00:00Z")}
        />
      );
    case "acces-coupe":
      return (
        <EcranAbonnement
          utilisateur={{ ...UTILISATEUR_FICTIF, abonnement: { ...UTILISATEUR_FICTIF.abonnement, coupe: true } }}
          liensPaiement={{ mensuelle: "https://buy.stripe.com/test_exemple", annuelle: "https://buy.stripe.com/test_annuel" }}
          maintenant={new Date("2027-01-10T10:00:00Z")}
        />
      );
    case "profil-annuel":
      return (
        <EcranProfil
          utilisateur={{
            ...UTILISATEUR_FICTIF,
            niveau: "performer",
            profil: "intensif",
            abonnement: { ...UTILISATEUR_FICTIF.abonnement, formule: "annuelle", fin: "2027-11-10T10:00:00.000Z" },
          }}
          maintenant={new Date("2027-01-10T10:00:00Z")}
        />
      );
    case "saison-vide":
      return <EcranSaison objectifs={[]} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "saison":
      return <EcranSaison objectifs={OBJECTIFS_FICTIFS} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "saison-en-cours":
      return <EcranSaison objectifs={OBJECTIFS_EN_COURS_FICTIFS} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "saison-calendrier":
      return <EcranSaison objectifs={OBJECTIFS_FICTIFS} aujourdhui={AUJOURDHUI_FICTIF} calendrierOuvert />;
    case "semaine":
      return <EcranSemaine utilisateur={UTILISATEUR_FICTIF} objectifs={OBJECTIFS_EN_COURS_FICTIFS} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "semaine-sans-objectif":
      return <EcranSemaine utilisateur={UTILISATEUR_FICTIF} objectifs={[]} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "records":
      return <EcranBientot titre="Mes records" description="Tes meilleures performances, au fil de tes séances." />;
    case "progres":
      return <EcranBientot titre="Mes progrès" description="Les courbes de tes tests de départ, sport par sport." />;
    case "zones-personnalisation":
      return (
        <>
          <EnTeteZones />
          <AffichageZones sport="course" test={TEST_FICTIF} bornesEnregistrees={[60, 78, 90, 95, 102, 110]} personnalisationOuverte />
        </>
      );
    default: {
      const sport = SPORTS.find((s) => `zones-${s.cle}` === ecran)?.cle;
      if (!sport) notFound();
      return (
        <>
          <EnTeteZones />
          <AffichageZones sport={sport} test={TEST_FICTIF} />
        </>
      );
    }
  }
}
