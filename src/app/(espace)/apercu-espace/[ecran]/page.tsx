import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilAdmin } from "@/app/(espace)/admin/AccueilAdmin";
import { EcranAgendaAdmin } from "@/app/(espace)/admin/agenda/EcranAgendaAdmin";
import { FormulaireEvenement } from "@/app/(espace)/admin/agenda/FormulaireEvenement";
import { EcranQuestionsAdmin } from "@/app/(espace)/admin/questions/EcranQuestionsAdmin";
import { EcranMembres } from "@/app/(espace)/admin/membres/EcranMembres";
import { EcranAdminRessources } from "@/app/(espace)/admin/ressources/EcranAdminRessources";
import { FormulaireContenu } from "@/app/(espace)/admin/ressources/FormulaireContenu";
import { GestionThemes } from "@/app/(espace)/admin/ressources/GestionThemes";
import { ModerationCommentaires } from "@/app/(espace)/admin/ressources/ModerationCommentaires";
import { AccueilCoach } from "@/app/(espace)/coach/AccueilCoach";
import { FicheAthlete } from "@/app/(espace)/coach/FicheAthlete";
import {
  ATHLETES_FICTIFS,
  AUJOURDHUI_FICTIF,
  COMMENTAIRES_ADMIN_FICTIFS,
  CONTENUS_ADMIN_FICTIFS,
  EVENEMENTS_FICTIFS,
  JOURNAL_FICTIF,
  MEMBRES_FICTIFS,
  OBJECTIFS_EN_COURS_FICTIFS,
  QUESTIONS_FICTIVES,
  SEANCES_COACH_FICTIVES,
  THEMES_FICTIFS,
} from "@/lib/apercu";
import { exigerApercu, UTILISATEUR_FICTIF } from "@/lib/apercu";

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
  if (ecran === "admin-ressources-nouveau") return <FormulaireContenu themes={THEMES_FICTIFS} />;
  if (ecran === "admin-ressources-video") {
    return <FormulaireContenu themes={THEMES_FICTIFS} contenu={CONTENUS_ADMIN_FICTIFS[0]} />;
  }
  if (ecran === "admin-ressources-pdf") return <FormulaireContenu themes={THEMES_FICTIFS} contenu={CONTENUS_ADMIN_FICTIFS[1]} />;
  if (ecran === "admin-ressources-themes") {
    const parRubrique: Record<string, number> = {};
    for (const c of CONTENUS_ADMIN_FICTIFS) parRubrique[`${c.theme}/${c.sous_rubrique}`] = (parRubrique[`${c.theme}/${c.sous_rubrique}`] ?? 0) + 1;
    return <GestionThemes themes={THEMES_FICTIFS} contenusParRubrique={parRubrique} />;
  }
  if (ecran === "admin-ressources-commentaires") return <ModerationCommentaires commentaires={COMMENTAIRES_ADMIN_FICTIFS} />;
  if (ecran === "admin-questions") return <EcranQuestionsAdmin questions={QUESTIONS_FICTIVES} />;
  if (ecran === "admin-agenda") return <EcranAgendaAdmin evenements={EVENEMENTS_FICTIFS} maintenant="2027-01-18T10:00:00.000Z" />;
  if (ecran === "admin-agenda-nouveau") return <FormulaireEvenement />;
  if (ecran === "admin-agenda-modifier") return <FormulaireEvenement evenement={EVENEMENTS_FICTIFS[0]} />;
  if (ecran === "admin-agenda-a-confirmer") return <FormulaireEvenement evenement={EVENEMENTS_FICTIFS[2]} />;
  notFound();
}
