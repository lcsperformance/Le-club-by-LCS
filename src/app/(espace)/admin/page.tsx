import type { Metadata } from "next";
import { Suspense } from "react";
import { Chargement } from "@/components/Chargement";
import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";
import { exigerRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Administration · Le Club by LCS" };

export default function PageAdmin() {
  return (
    <Suspense fallback={<Chargement />}>
      <Contenu />
    </Suspense>
  );
}

const LIENS = [
  { href: "/accueil", titre: "Voir l'espace membre", texte: "Parcourir l'app comme un athlète, avec la barre d'onglets." },
  { href: "/coach", titre: "Voir l'espace coach", texte: "L'historique des athlètes, en lecture seule." },
  { href: "/admin/composants", titre: "Vitrine des composants", texte: "Cartes, boutons, champs et pastilles de zone." },
];

async function Contenu() {
  const utilisateur = await exigerRole("admin");
  return (
    <>
      <EnTeteEspace titre="Administration" email={utilisateur.email} />
      <Carte as="section">
        <p className="message-info">Ici, tu géreras les membres, leurs rôles et leurs abonnements.</p>
      </Carte>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {LIENS.map((l) => (
          <Carte key={l.href} href={l.href}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>{l.titre} →</span>
            <span style={{ display: "block", marginTop: 6, fontSize: 13, color: "var(--texte-doux)" }}>{l.texte}</span>
          </Carte>
        ))}
      </div>
    </>
  );
}
