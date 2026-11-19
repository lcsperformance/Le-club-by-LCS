import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteMembre } from "@/components/EnTeteMembre";
import { BoutonPrincipal, Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";
import { formatJourFr } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Accueil · Le Club by LCS" };

const MESSAGES: Record<string, string> = {
  "tests-enregistres": "Tes tests sont enregistrés. Le calcul de tes zones arrive très bientôt.",
};

export default function PageAccueil({ searchParams }: PageProps<"/accueil">) {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu searchParams={searchParams} />
    </Suspense>
  );
}

async function Contenu({ searchParams }: Pick<PageProps<"/accueil">, "searchParams">) {
  const utilisateur = await exigerRole("membre", "admin");
  const { message } = await searchParams;
  const texteMessage = typeof message === "string" ? MESSAGES[message] : undefined;

  const supabase = await createClient();
  const { count } = await supabase
    .from("tests")
    .select("id", { count: "exact", head: true })
    .eq("membre_id", utilisateur.id);
  const testsFaits = (count ?? 0) > 0;

  return (
    <>
      <EnTeteMembre utilisateur={utilisateur} titre="Salut !" sousTitre={formatJourFr(new Date())} />

      {texteMessage && (
        <Carte>
          <p className="message-info" role="status">
            {texteMessage}
          </p>
        </Carte>
      )}

      {testsFaits ? (
        <Carte href="/tests" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent)", flex: "none" }} />
          <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>Tes tests sont enregistrés</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Refaire</span>
        </Carte>
      ) : (
        <section
          aria-labelledby="etape-tests"
          style={{
            background: "var(--aurore)",
            color: "var(--fond)",
            borderRadius: 20,
            padding: 18,
            display: "grid",
            gap: 10,
            boxShadow: "0 14px 34px rgba(250, 148, 255, 0.3)",
          }}
        >
          <span
            style={{
              justifySelf: "start",
              background: "var(--accent)",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            Étape 1
          </span>
          <h2 id="etape-tests" className="titre-carte" style={{ fontSize: 19, lineHeight: 1.2 }}>
            Définis tes zones pour débloquer tes allures
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.4 }}>Quatre mesures à faire en autonomie : course, vélo, natation et cardio.</p>
          <BoutonPrincipal href="/tests" style={{ minHeight: 48, fontSize: 16, boxShadow: "none" }}>
            Faire mes tests
          </BoutonPrincipal>
        </section>
      )}

      <Carte as="section">
        <p className="message-info">Ton programme arrive bientôt. Lancement le 1er janvier 2027.</p>
      </Carte>
    </>
  );
}
