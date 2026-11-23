import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { carteAujourdhui, nouveauCetteSemaine } from "@/lib/accueil";
import { prochaineFaq } from "@/lib/agenda";
import { exigerRole } from "@/lib/auth";
import { lireEvenements } from "@/lib/club-serveur";
import { dateDuJourParis } from "@/lib/dates";
import { lireSeancesFaites, lireSemaineProgramme } from "@/lib/programme-serveur";
import { lireCatalogue, lireThemes, semaineDuMembre } from "@/lib/ressources-serveur";
import { organiserSaison } from "@/lib/saison";
import { lireObjectifs } from "@/lib/saison-serveur";
import { joursDeLaSemaine } from "@/lib/semaine";
import { createClient } from "@/lib/supabase/server";
import { AccueilMembre } from "./AccueilMembre";

export const metadata: Metadata = { title: "Accueil · Le Club by LCS" };

export default function PageAccueil() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  const utilisateur = await exigerRole("membre", "admin");
  const maintenant = new Date();
  const aujourdhui = dateDuJourParis(maintenant);
  const jours = joursDeLaSemaine(aujourdhui);
  const jour = jours.findIndex((j) => j.iso === aujourdhui) + 1;
  const supabase = await createClient();

  const [{ count: nbTests }, { count: nbQuestions }, objectifs, evenements, themes, catalogue, faites] = await Promise.all([
    supabase.from("tests").select("id", { count: "exact", head: true }).eq("membre_id", utilisateur.id),
    // Questions pas encore traitées : celles qui seront posées à la prochaine FAQ.
    supabase.from("questions_faq").select("id", { count: "exact", head: true }).is("traitee_le", null),
    lireObjectifs(utilisateur.id),
    lireEvenements(),
    lireThemes(),
    lireCatalogue(),
    lireSeancesFaites(utilisateur.id, aujourdhui, aujourdhui),
  ]);
  const programme = await lireSemaineProgramme(utilisateur, organiserSaison(objectifs, aujourdhui), jours[0].iso);

  return (
    <AccueilMembre
      utilisateur={utilisateur}
      testsFaits={(nbTests ?? 0) > 0}
      objectifs={objectifs}
      aujourdhui={maintenant}
      seanceDuJour={carteAujourdhui(
        programme?.seances ?? null,
        jour,
        aujourdhui,
        faites.map((f) => f.split("|")[1]),
      )}
      faq={{ evenement: prochaineFaq(evenements, maintenant), questions: nbQuestions ?? 0 }}
      nouveau={nouveauCetteSemaine(themes, catalogue, semaineDuMembre(utilisateur, aujourdhui))}
    />
  );
}
