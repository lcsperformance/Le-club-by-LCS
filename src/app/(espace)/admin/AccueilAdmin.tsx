import { EnTeteEspace } from "@/components/EnTeteEspace";
import { Carte } from "@/components/ui";

const LIENS = [
  {
    href: "/admin/membres",
    titre: "Membres",
    texte: "Abonnements, niveaux et ancienneté ; ouvrir ou couper un accès, renvoyer l'e-mail d'accès.",
  },
  {
    href: "/admin/equipe",
    titre: "Équipe",
    texte: "Coachs et admins : donner à un compte le rôle Coach, Coach + admin ou Admin.",
  },
  {
    href: "/admin/ressources",
    titre: "Ressources",
    texte: "Thèmes, sous-rubriques, PDF et vidéos, semaine de déblocage ; modération des commentaires.",
  },
  { href: "/admin/agenda", titre: "Agenda", texte: "FAQ en visio, webinaires et autres événements du Club, à l'heure de Paris." },
  { href: "/admin/canaux", titre: "Canaux du Club", texte: "Ajouter, renommer ou supprimer les canaux collectifs (jamais de canal privé)." },
  { href: "/admin/questions", titre: "Boîte à questions", texte: "Les questions des membres pour préparer la FAQ en visio (sans votes)." },
  { href: "/admin/partenaires", titre: "Partenaires", texte: "Les remises et codes promo de l'onglet Avantages." },
  { href: "/accueil", titre: "Voir l'espace membre", texte: "Parcourir l'app comme un athlète, avec la barre d'onglets." },
  { href: "/coach", titre: "Voir l'espace coach", texte: "L'historique des athlètes, en lecture seule." },
  { href: "/admin/composants", titre: "Vitrine des composants", texte: "Cartes, boutons, champs et pastilles de zone." },
];

/** Contenu de l'écran d'administration. */
export function AccueilAdmin({ email }: { email: string }) {
  return (
    <>
      <EnTeteEspace titre="Administration" email={email} />
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
