import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageFormulaire } from "@/app/(espace)/admin/PageFormulaire";
import { GestionCanaux } from "@/app/(espace)/admin/canaux/GestionCanaux";
import { AccueilAdmin } from "@/app/(espace)/admin/AccueilAdmin";
import { EcranAgendaAdmin } from "@/app/(espace)/admin/agenda/EcranAgendaAdmin";
import { FormulaireEvenement } from "@/app/(espace)/admin/agenda/FormulaireEvenement";
import { GestionPartenaires } from "@/app/(espace)/admin/partenaires/GestionPartenaires";
import { EcranQuestionsAdmin } from "@/app/(espace)/admin/questions/EcranQuestionsAdmin";
import { EcranMembres } from "@/app/(espace)/admin/membres/EcranMembres";
import { EcranEquipe } from "@/app/(espace)/admin/equipe/EcranEquipe";
import { EcranAdminRessources } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import { FormulaireContenu } from "@/app/(espace)/admin/ressources/FormulaireContenu";
import { GestionThemes } from "@/app/(espace)/admin/ressources/GestionThemes";
import { ModerationCommentaires } from "@/app/(espace)/admin/ressources/ModerationCommentaires";
import { AccueilCoach } from "@/app/(espace)/coach/AccueilCoach";
import { FicheAthlete } from "@/app/(espace)/coach/FicheAthlete";
import {
  ATHLETES_FICTIFS,
  COMPTES_EQUIPE_FICTIFS,
  AUJOURDHUI_FICTIF,
  COMMENTAIRES_ADMIN_FICTIFS,
  CONTENUS_ADMIN_FICTIFS,
  EVENEMENTS_FICTIFS,
  JOURNAL_FICTIF,
  MEMBRES_FICTIFS,
  OBJECTIFS_EN_COURS_FICTIFS,
  PARTENAIRES_FICTIFS,
  QUESTIONS_FICTIVES,
  SEANCES_COACH_FICTIVES,
  THEMES_FICTIFS,
} from "@/lib/apercu";
import { CANAUX_FICTIFS, exigerApercu, UTILISATEUR_FICTIF } from "@/lib/apercu";

/** Aperçus des espaces admin et coach (mode test uniquement). */
export default function ApercuEspace({ params }: PageProps<"/apercu-espace/[ecran]">) {
  return (
    <Suspense fallback={null}>
      <Ecran params={params} />
    </Suspense>
  );
}

async function Ecran({ params }: Pick<PageProps<"/apercu-espace/[ecran]">, "params">) {
  await exigerApercu();
  const { ecran } = await params;
  if (ecran === "admin") return <AccueilAdmin email={UTILISATEUR_FICTIF.email} />;
  if (ecran === "admin-membres") {
    return <EcranMembres membres={MEMBRES_FICTIFS} journal={JOURNAL_FICTIF} maintenant="2027-01-10T10:00:00.000Z" />;
  }
  if (ecran === "coach") return <AccueilCoach email={UTILISATEUR_FICTIF.email} athletes={ATHLETES_FICTIFS} />;
  if (ecran === "coach-fiche" || ecran === "coach-fiche-vide") {
    const a = ATHLETES_FICTIFS[ecran === "coach-fiche" ? 0 : 3];
    return (
      <AccueilCoach
        email={UTILISATEUR_FICTIF.email}
        athletes={ATHLETES_FICTIFS}
        choisi={a.id}
        fiche={
          <FicheAthlete
            athlete={a}
            objectifs={ecran === "coach-fiche" ? OBJECTIFS_EN_COURS_FICTIFS : []}
            seances={ecran === "coach-fiche" ? SEANCES_COACH_FICTIVES : []}
            aujourdhui={AUJOURDHUI_FICTIF}
          />
        }
      />
    );
  }
  if (ecran === "admin-ressources") {
    return <EcranAdminRessources themes={THEMES_FICTIFS} contenus={CONTENUS_ADMIN_FICTIFS} nbCommentaires={COMMENTAIRES_ADMIN_FICTIFS.length} />;
  }
  if (ecran === "admin-ressources-nouveau") return (
      <PageFormulaire retour={{ href: "/admin/ressources", libelle: "Ressources" }} titre="Ajouter un contenu">
        <FormulaireContenu themes={THEMES_FICTIFS} />
      </PageFormulaire>
    );
  if (ecran === "admin-ressources-video") {
    return (
      <PageFormulaire retour={{ href: "/admin/ressources", libelle: "Ressources" }} titre="Modifier un contenu">
        <FormulaireContenu themes={THEMES_FICTIFS} contenu={CONTENUS_ADMIN_FICTIFS[0]} />
      </PageFormulaire>
    );
  }
  if (ecran === "admin-ressources-pdf") return (
      <PageFormulaire retour={{ href: "/admin/ressources", libelle: "Ressources" }} titre="Modifier un contenu">
        <FormulaireContenu themes={THEMES_FICTIFS} contenu={CONTENUS_ADMIN_FICTIFS[1]} />
      </PageFormulaire>
    );
  if (ecran === "admin-ressources-themes") {
    const parRubrique: Record<string, number> = {};
    for (const c of CONTENUS_ADMIN_FICTIFS) parRubrique[`${c.theme}/${c.sous_rubrique}`] = (parRubrique[`${c.theme}/${c.sous_rubrique}`] ?? 0) + 1;
    return <GestionThemes themes={THEMES_FICTIFS} contenusParRubrique={parRubrique} />;
  }
  if (ecran === "admin-ressources-commentaires") return <ModerationCommentaires commentaires={COMMENTAIRES_ADMIN_FICTIFS} />;
  if (ecran === "admin-equipe") return <EcranEquipe comptes={COMPTES_EQUIPE_FICTIFS} moi={UTILISATEUR_FICTIF.id} />;
  if (ecran === "admin-partenaires") return <GestionPartenaires partenaires={PARTENAIRES_FICTIFS} />;
  if (ecran === "admin-canaux") return <GestionCanaux canaux={CANAUX_FICTIFS} messagesParCanal={{ annonces: 3, general: 128, "bloc-m": 12 }} />;
  if (ecran === "admin-questions") return <EcranQuestionsAdmin questions={QUESTIONS_FICTIVES} />;
  if (ecran === "admin-agenda") return <EcranAgendaAdmin evenements={EVENEMENTS_FICTIFS} maintenant="2027-01-18T10:00:00.000Z" />;
  if (ecran === "admin-agenda-nouveau") return (
      <PageFormulaire retour={{ href: "/admin/agenda", libelle: "Agenda" }} titre="Ajouter un événement">
        <FormulaireEvenement />
      </PageFormulaire>
    );
  if (ecran === "admin-agenda-modifier") return (
      <PageFormulaire retour={{ href: "/admin/agenda", libelle: "Agenda" }} titre="Modifier un événement">
        <FormulaireEvenement evenement={EVENEMENTS_FICTIFS[0]} />
      </PageFormulaire>
    );
  if (ecran === "admin-agenda-a-confirmer") return (
      <PageFormulaire retour={{ href: "/admin/agenda", libelle: "Agenda" }} titre="Modifier un événement">
        <FormulaireEvenement evenement={EVENEMENTS_FICTIFS[2]} />
      </PageFormulaire>
    );
  notFound();
}
