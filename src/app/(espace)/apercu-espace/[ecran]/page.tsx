import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccueilAdmin } from "@/app/(espace)/admin/AccueilAdmin";
import { AccueilCoach } from "@/app/(espace)/coach/AccueilCoach";
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
  if (ecran === "coach") return <AccueilCoach email={UTILISATEUR_FICTIF.email} />;
  notFound();
}
