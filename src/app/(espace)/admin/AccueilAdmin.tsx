import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";

const LIENS = [
  { href: "/accueil", titre: "Voir l'espace membre", texte: "Parcourir l'app comme un athlète, avec la barre d'onglets." },
  { href: "/coach", titre: "Voir l'espace coach", texte: "L'historique des athlètes, en lecture seule." },
  { href: "/admin/composants", titre: "Vitrine des composants", texte: "Cartes, boutons, champs et pastilles de zone." },
];

/** Contenu de l'écran d'administration. */
export function AccueilAdmin({ email }: { email: string }) {
  return (
    <>
      <EnTeteEspace titre="Administration" email={email} />
      <Carte as="section">
        <p className="message-info">Ici, tu géreras les membres, leurs rôles et leurs abonnements.</p>
      </Carte>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}>
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
