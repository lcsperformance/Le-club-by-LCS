import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilMembre } from "@/app/(membre)/accueil/AccueilMembre";
import { EcranAbonnement } from "@/app/(membre)/abonnement/EcranAbonnement";
import { EcranProfil } from "@/app/(membre)/profil/EcranProfil";
import { EcranProgres } from "@/app/(membre)/progres/EcranProgres";
import { EcranRecords } from "@/app/(membre)/records/EcranRecords";
import { EcranSaison } from "@/app/(membre)/saison/EcranSaison";
import { EcranSeance } from "@/app/(membre)/seance/[id]/EcranSeance";
import { EcranSemaine } from "@/app/(membre)/semaine/EcranSemaine";
import { EnTeteTests } from "@/app/(membre)/tests/EnTeteTests";
import { FormulaireTests } from "@/app/(membre)/tests/FormulaireTests";
import { AffichageZones } from "@/app/(membre)/zones/AffichageZones";
import { EnTeteZones } from "@/app/(membre)/zones/EnTeteZones";
import {
  AUJOURDHUI_FICTIF,
  exigerApercu,
  HISTORIQUE_COURSE_FICTIF,
  HISTORIQUE_VELO_FICTIF,
  OBJECTIFS_EN_COURS_FICTIFS,
  OBJECTIFS_FICTIFS,
  RECORDS_FICTIFS,
  SEANCE_COURSE_FICTIVE,
  SEANCE_RENFO_FICTIVE,
  SEANCES_FAITES_FICTIVES,
  SEMAINE_FICTIVE,
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
      return <AccueilMembre utilisateur={UTILISATEUR_FICTIF} testsFaits={false} objectifs={[]} aujourdhui={new Date()} />;
    case "accueil-sans-prenom":
      return (
        <AccueilMembre
          utilisateur={{ ...UTILISATEUR_FICTIF, prenom: null }}
          testsFaits
          objectifs={OBJECTIFS_FICTIFS}
          aujourdhui={new Date(`${AUJOURDHUI_FICTIF}T10:00:00Z`)}
        />
      );
    case "accueil-tests-faits":
      return (
        <AccueilMembre
          utilisateur={UTILISATEUR_FICTIF}
          testsFaits
          objectifs={OBJECTIFS_EN_COURS_FICTIFS}
          aujourdhui={new Date(`${AUJOURDHUI_FICTIF}T10:00:00Z`)}
        />
      );
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
    case "semaine-tests-a-faire":
    case "semaine-a-venir":
      return (
        <EcranSemaine
          utilisateur={{ ...UTILISATEUR_FICTIF, niveau: "challenger", profil: "extensif" }}
          objectifs={OBJECTIFS_EN_COURS_FICTIFS}
          aujourdhui={AUJOURDHUI_FICTIF}
          programme={{ semaine: { phase: "M", semaine: 5 }, seances: ecran === "semaine-a-venir" ? [] : SEMAINE_FICTIVE }}
          testsFaits={ecran !== "semaine-tests-a-faire"}
          faites={SEANCES_FAITES_FICTIVES}
        />
      );
    case "semaine-sans-objectif":
      return <EcranSemaine utilisateur={UTILISATEUR_FICTIF} objectifs={[]} aujourdhui={AUJOURDHUI_FICTIF} programme={null} testsFaits={false} />;
    case "seance":
      return <EcranSeance seance={SEANCE_COURSE_FICTIVE} tests={TEST_FICTIF} suivi={{ jour: AUJOURDHUI_FICTIF, ressenti: null, interdit: null }} />;
    case "seance-faite":
      return (
        <EcranSeance
          seance={SEANCE_COURSE_FICTIVE}
          tests={TEST_FICTIF}
          suivi={{ jour: AUJOURDHUI_FICTIF, ressenti: { rpe: 7, douleur: true, commentaire: "Genou droit un peu raide sur la fin." }, interdit: null }}
        />
      );
    case "seance-a-venir":
      return (
        <EcranSeance
          seance={SEANCE_RENFO_FICTIVE}
          tests={null}
          suivi={{ jour: "2027-01-14", ressenti: null, interdit: "Tu pourras marquer cette séance le jour J." }}
        />
      );
    case "seance-verrouillee":
      return <EcranSeance seance={SEANCE_COURSE_FICTIVE} tests={null} />;
    case "seance-renfo":
      return <EcranSeance seance={SEANCE_RENFO_FICTIVE} tests={null} />;
    case "records":
      return <EcranRecords records={RECORDS_FICTIFS} />;
    case "records-vide":
      return <EcranRecords records={{}} />;
    case "progres":
      return <EcranProgres sport="course" points={HISTORIQUE_COURSE_FICTIF} testsFaits />;
    case "progres-velo":
      return <EcranProgres sport="velo" points={HISTORIQUE_VELO_FICTIF} testsFaits />;
    case "progres-un-test":
      return <EcranProgres sport="natation" points={[{ date: "2027-01-11", valeur: 105 }]} testsFaits />;
    case "progres-sans-mesure":
      return <EcranProgres sport="cardio" points={[]} testsFaits />;
    case "progres-sans-test":
      return <EcranProgres sport="course" points={[]} testsFaits={false} />;
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
