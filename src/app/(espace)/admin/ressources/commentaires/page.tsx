import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { lireCommentairesAdmin } from "@/lib/admin/ressources-serveur";
import { exigerRole } from "@/lib/auth";
import { RetourAdmin } from "../EcranAdminRessources";
import { ModerationCommentaires } from "../ModerationCommentaires";

export const metadata: Metadata = { title: "Commentaires · Administration · Le Club by LCS" };

export default function PageCommentaires() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

async function Contenu() {
  await exigerRole("admin");
  return (
    <>
      <RetourAdmin href="/admin/ressources" libelle="Ressources" />
      <header>
        <h1 className="titre" style={{ fontSize: 26 }}>
          Commentaires
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, color: "var(--texte-doux)" }}>
          Les 200 derniers commentaires sous les vidéos. Chaque suppression est notée dans le journal de l&apos;admin.
        </p>
      </header>
      <ModerationCommentaires commentaires={await lireCommentairesAdmin()} />
    </>
  );
}
