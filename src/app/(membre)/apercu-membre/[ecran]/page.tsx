import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilMembre } from "@/app/(membre)/accueil/AccueilMembre";
import { EcranAbonnement } from "@/app/(membre)/abonnement/EcranAbonnement";
import { EcranProfil } from "@/app/(membre)/profil/EcranProfil";
import { BandeauEvenement } from "@/components/BandeauEvenement";
import { EcranProgres } from "@/app/(membre)/progres/EcranProgres";
import { EcranRecords } from "@/app/(membre)/records/EcranRecords";
import { EcranAvantages } from "@/app/(membre)/avantages/EcranAvantages";
import { EcranCanal } from "@/app/(membre)/club/[canal]/EcranCanal";
import { EcranAgenda } from "@/app/(membre)/club/agenda/EcranAgenda";
import { EcranQuestions } from "@/app/(membre)/club/questions/EcranQuestions";
import { EcranClub } from "@/app/(membre)/club/EcranClub";
import { EcranCalculateur } from "@/app/(membre)/ressources/calculateur/EcranCalculateur";
import { EcranContenu } from "@/app/(membre)/ressources/contenu/[id]/EcranContenu";
import { EcranRessources } from "@/app/(membre)/ressources/EcranRessources";
import { EcranTheme } from "@/app/(membre)/ressources/EcranTheme";
import { EcranSaison } from "@/app/(membre)/saison/EcranSaison";
import { EcranSeance } from "@/app/(membre)/seance/[id]/EcranSeance";
import { EcranSemaine } from "@/app/(membre)/semaine/EcranSemaine";
import { EnTeteTests } from "@/app/(membre)/tests/EnTeteTests";
import { FormulaireTests } from "@/app/(membre)/tests/FormulaireTests";
import { AffichageZones } from "@/app/(membre)/zones/AffichageZones";
import { EnTeteZones } from "@/app/(membre)/zones/EnTeteZones";
import {
  ANNONCES_FICTIVES,
  AUJOURDHUI_FICTIF,
  CANAUX_FICTIFS,
  COMMENTAIRES_FICTIFS,
  EVENEMENTS_FICTIFS,
  exigerApercu,
  HISTORIQUE_COURSE_FICTIF,
  HISTORIQUE_VELO_FICTIF,
  OBJECTIFS_EN_COURS_FICTIFS,
  MESSAGES_FICTIFS,
  NON_LUS_FICTIFS,
  OBJECTIFS_FICTIFS,
  PARTENAIRES_FICTIFS,
  QUESTIONS_FICTIVES,
  RECORDS_FICTIFS,
  RESSOURCES_FICTIVES,
  SEMAINE_RESSOURCES_FICTIVE,
  SUIVIS_FICTIFS,
  THEMES_FICTIFS,
  SEANCE_COURSE_FICTIVE,
  SEANCE_RENFO_FICTIVE,
  SEANCES_FAITES_FICTIVES,
  SEMAINE_FICTIVE,
  TEST_FICTIF,
  UTILISATEUR_FICTIF,
} from "@/lib/apercu";
import { carteAujourdhui, nouveauCetteSemaine } from "@/lib/accueil";
import { cartesThemes, favoris, sousRubriques, themeParCle, vueContenu } from "@/lib/ressources";
import { profilSuggere } from "@/lib/profil-suggere";
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
      return (
        <>
          <BandeauEvenement toujours evenement={EVENEMENTS_FICTIFS[0]} quand="Demain · 19 h 30" />
          <AccueilMembre
            utilisateur={UTILISATEUR_FICTIF}
            testsFaits={false}
            objectifs={[]}
            aujourdhui={new Date()}
            seanceDuJour={carteAujourdhui(null, 1, AUJOURDHUI_FICTIF, [])}
            faq={{ evenement: null, questions: 0 }}
            nouveau={null}
          />
        </>
      );
    case "bandeau-titre-long":
      return <BandeauEvenement toujours evenement={EVENEMENTS_FICTIFS[1]} quand="Jeu. 21 janv. · 20 h 00" />;
    case "accueil-sans-prenom":
    case "accueil-tests-faits":
    case "accueil-seance-faite":
    case "accueil-deux-seances":
    case "accueil-repos":
    case "accueil-a-venir":
    case "accueil-installer-android":
    case "accueil-installer-iphone":
    case "accueil-notifications":
    case "accueil-notifications-iphone": {
      // Lundi 11/01/2027 : natation au programme ; le jeudi a deux séances, le vendredi est un jour de repos.
      const jour = ecran === "accueil-deux-seances" ? 4 : ecran === "accueil-repos" ? 5 : 1;
      const faites = ecran === "accueil-seance-faite" ? [SEMAINE_FICTIVE[0].seance.id] : [];
      const semaine = ecran === "accueil-a-venir" ? [] : SEMAINE_FICTIVE;
      const calme = ecran === "accueil-repos" || ecran === "accueil-a-venir";
      return (
        <AccueilMembre
          utilisateur={ecran === "accueil-sans-prenom" ? { ...UTILISATEUR_FICTIF, prenom: null } : UTILISATEUR_FICTIF}
          testsFaits
          objectifs={ecran === "accueil-sans-prenom" ? OBJECTIFS_FICTIFS : OBJECTIFS_EN_COURS_FICTIFS}
          aujourdhui={new Date(`${AUJOURDHUI_FICTIF}T10:00:00Z`)}
          seanceDuJour={carteAujourdhui(semaine, jour, AUJOURDHUI_FICTIF, faites)}
          faq={calme ? { evenement: null, questions: 0 } : { evenement: EVENEMENTS_FICTIFS[0], questions: 3 }}
          nouveau={calme ? null : nouveauCetteSemaine(THEMES_FICTIFS, RESSOURCES_FICTIVES, SEMAINE_RESSOURCES_FICTIVE)}
          installation={ecran === "accueil-installer-android" ? "android" : ecran === "accueil-installer-iphone" ? "iphone" : undefined}
          notifications={ecran === "accueil-notifications" ? "activer" : ecran === "accueil-notifications-iphone" ? "installer-d-abord" : undefined}
        />
      );
    }
    case "tests":
      return (
        <>
          <EnTeteTests />
          <FormulaireTests valeursInitiales={valeursDeDepart(null)} />
        </>
      );
    case "tests-pma":
      return (
        <>
          <EnTeteTests />
          <FormulaireTests valeursInitiales={valeursDeDepart(TEST_FICTIF)} facultativesFaites={["pma_5min"]} />
        </>
      );
    case "profil":
      return (
        <EcranProfil
          utilisateur={{ ...UTILISATEUR_FICTIF, niveau: "challenger", profil: "extensif" }}
          maintenant={new Date("2027-01-10T10:00:00Z")}
          suggestion={profilSuggere(TEST_FICTIF)}
          notifications={{ annonces: true, faq: false, evenements: true }}
          appareilApercu={{ priseEnCharge: true, permission: "granted", abonne: true, apple: false, installee: true }}
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
          suggestion={profilSuggere(null)}
          appareilApercu={{ priseEnCharge: false, permission: null, abonne: false, apple: true, installee: false }}
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
          navigation={{ precedente: "2027-01-04", suivante: ecran === "semaine" ? "2027-01-18" : null }}
        />
      );
    case "semaine-passee":
      return (
        <EcranSemaine
          utilisateur={{ ...UTILISATEUR_FICTIF, niveau: "challenger", profil: "extensif" }}
          objectifs={OBJECTIFS_EN_COURS_FICTIFS}
          aujourdhui={AUJOURDHUI_FICTIF}
          programme={{ semaine: { phase: "fil_rouge", semaine: 1 }, seances: SEMAINE_FICTIVE }}
          testsFaits
          faites={["2026-11-16|00000000-0000-0000-0000-000000000101"]}
          lundi="2026-11-16"
          navigation={{ precedente: null, suivante: "2026-11-23" }}
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
          suivi={{ jour: AUJOURDHUI_FICTIF, ressenti: { rpe: 7, commentaire: "Dur sur la fin, mais allure tenue." }, interdit: null }}
        />
      );
    case "seance-ancienne":
      return (
        <EcranSeance
          seance={SEANCE_COURSE_FICTIVE}
          tests={TEST_FICTIF}
          suivi={{
            jour: "2026-11-17",
            ressenti: { rpe: 6, commentaire: "Bonnes sensations, un peu de vent de face sur le retour." },
            interdit: "On ne peut plus noter une séance de plus de 14 jours.",
          }}
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
    case "club":
      return <EcranClub utilisateur={UTILISATEUR_FICTIF} canaux={CANAUX_FICTIFS} nonLus={NON_LUS_FICTIFS} monBloc="bloc-m" direct={false} />;
    case "club-canal":
    case "club-canal-admin":
    case "club-canal-vide":
      return (
        <EcranCanal
          canal={CANAUX_FICTIFS[1]}
          messages={ecran === "club-canal-vide" ? [] : MESSAGES_FICTIFS}
          encore={ecran === "club-canal"}
          aujourdhui={AUJOURDHUI_FICTIF}
          moi={{ id: UTILISATEUR_FICTIF.id, role: ecran === "club-canal-admin" ? "admin" : "membre" }}
          direct={false}
        />
      );
    case "club-annonces":
    case "club-annonces-coach":
      return (
        <EcranCanal
          canal={CANAUX_FICTIFS[0]}
          messages={ANNONCES_FICTIVES}
          encore={false}
          aujourdhui={AUJOURDHUI_FICTIF}
          moi={{ id: UTILISATEUR_FICTIF.id, role: ecran === "club-annonces-coach" ? "coach" : "membre" }}
          direct={false}
        />
      );
    case "avantages":
      return <EcranAvantages utilisateur={UTILISATEUR_FICTIF} partenaires={PARTENAIRES_FICTIFS.filter((p) => p.affiche)} />;
    case "avantages-vide":
      return <EcranAvantages utilisateur={UTILISATEUR_FICTIF} partenaires={[]} />;
    case "calculateur":
      return <EcranCalculateur integrable adresseCadre="about:blank" />;
    case "calculateur-ouvrir":
      return <EcranCalculateur integrable={false} />;
    case "club-questions":
      return <EcranQuestions utilisateur={UTILISATEUR_FICTIF} prochaine={EVENEMENTS_FICTIFS[0]} questions={QUESTIONS_FICTIVES} />;
    case "club-questions-vide":
      return <EcranQuestions utilisateur={UTILISATEUR_FICTIF} prochaine={null} questions={[]} />;
    case "club-agenda":
      return <EcranAgenda utilisateur={UTILISATEUR_FICTIF} evenements={EVENEMENTS_FICTIFS} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "club-agenda-vide":
      return <EcranAgenda utilisateur={UTILISATEUR_FICTIF} evenements={[]} aujourdhui={AUJOURDHUI_FICTIF} />;
    case "ressources":
      return (
        <EcranRessources
          themes={cartesThemes(THEMES_FICTIFS, RESSOURCES_FICTIVES, SEMAINE_RESSOURCES_FICTIVE)}
          nbFavoris={favoris(THEMES_FICTIFS, RESSOURCES_FICTIVES, SUIVIS_FICTIFS, SEMAINE_RESSOURCES_FICTIVE).length}
        />
      );
    case "ressources-theme": {
      const theme = themeParCle(THEMES_FICTIFS, "nutrition")!;
      return (
        <EcranTheme
          titre={theme.nom}
          rubriques={sousRubriques(theme, RESSOURCES_FICTIVES).map((r) => ({
            cle: r.cle,
            nom: r.nom,
            contenus: r.contenus.map((c) => vueContenu(c, SEMAINE_RESSOURCES_FICTIVE, SUIVIS_FICTIFS[c.id])),
          }))}
        />
      );
    }
    case "ressources-favoris":
    case "ressources-favoris-vide":
      return (
        <EcranTheme
          titre="Mes favoris"
          rubriques={[
            {
              cle: "favoris",
              nom: "Contenus ajoutés en favoris",
              contenus:
                ecran === "ressources-favoris"
                  ? favoris(THEMES_FICTIFS, RESSOURCES_FICTIVES, SUIVIS_FICTIFS, SEMAINE_RESSOURCES_FICTIVE).map((c) => vueContenu(c, SEMAINE_RESSOURCES_FICTIVE, SUIVIS_FICTIFS[c.id]))
                  : [],
            },
          ]}
          messageVide="Aucun favori pour l'instant. Touche l'étoile d'un contenu pour l'ajouter ici."
        />
      );
    case "ressources-video":
      return (
        <EcranContenu
          ressource={RESSOURCES_FICTIVES[0]}
          theme={THEMES_FICTIFS[0]}
          semaine={SEMAINE_RESSOURCES_FICTIVE}
          media={{ youtube_id: null, fichier_disponible: false }}
          suivi={SUIVIS_FICTIFS[RESSOURCES_FICTIVES[0].id]}
          commentaires={COMMENTAIRES_FICTIFS}
        />
      );
    case "ressources-pdf":
      return (
        <EcranContenu
          ressource={RESSOURCES_FICTIVES[1]}
          theme={THEMES_FICTIFS[0]}
          semaine={SEMAINE_RESSOURCES_FICTIVE}
          media={{ youtube_id: null, fichier_disponible: true }}
          suivi={SUIVIS_FICTIFS[RESSOURCES_FICTIVES[1].id]}
        />
      );
    case "ressources-pdf-bientot":
      return <EcranContenu ressource={RESSOURCES_FICTIVES[3]} theme={THEMES_FICTIFS[0]} semaine={4} media={{ youtube_id: null, fichier_disponible: false }} />;
    case "ressources-verrouille":
      return <EcranContenu ressource={RESSOURCES_FICTIVES[6]} theme={THEMES_FICTIFS[4]} semaine={SEMAINE_RESSOURCES_FICTIVE} />;
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
    case "zones-cardio-personnalisation":
      return (
        <>
          <EnTeteZones />
          <AffichageZones sport="cardio" test={TEST_FICTIF} bornesEnregistrees={[65, 80, 90, 94, 100, 106]} personnalisationOuverte />
        </>
      );
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
