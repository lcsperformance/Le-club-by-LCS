import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilMembre } from "@/app/(membre)/accueil/AccueilMembre";
import { EnTeteTests } from "@/app/(membre)/tests/EnTeteTests";
import { FormulaireTests } from "@/app/(membre)/tests/FormulaireTests";
import { AffichageZones } from "@/app/(membre)/zones/AffichageZones";
import { EnTeteZones } from "@/app/(membre)/zones/EnTeteZones";
import { exigerApercu, TEST_FICTIF, UTILISATEUR_FICTIF } from "@/lib/apercu";
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
    case "accueil-tests-faits":
      return <AccueilMembre utilisateur={UTILISATEUR_FICTIF} testsFaits aujourdhui={new Date()} />;
    case "tests":
      return (
        <>
          <EnTeteTests />
          <FormulaireTests valeursInitiales={valeursDeDepart(null)} />
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
