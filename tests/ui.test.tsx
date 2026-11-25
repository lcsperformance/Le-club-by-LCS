import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/semaine" }));

import { BarreOnglets } from "@/components/BarreOnglets";
import { MenuLateral } from "@/components/MenuLateral";
import { BoutonPrincipal, BoutonSecondaire, Carte, Champ, PastilleZone, ZONES } from "@/components/ui";
import { barreVisible, cheminAffiche, ONGLETS, ongletActif, profilActif } from "@/lib/onglets";

describe("barre d'onglets", () => {
  it("a 5 onglets dans l'ordre de la maquette", () => {
    expect(ONGLETS.map((o) => o.libelle)).toEqual(["Accueil", "Semaine", "Ressources", "Club", "Avantages"]);
  });

  it("trouve l'onglet actif, sous-pages comprises", () => {
    expect(ongletActif("/accueil")).toBe("accueil");
    expect(ongletActif("/club/canaux/general")).toBe("club");
    expect(ongletActif("/clubs")).toBeNull();
    expect(ongletActif("/admin")).toBeNull();
  });

  it("Ma saison et les séances sont rattachées à l'onglet Semaine", () => {
    expect(ongletActif("/saison")).toBe("semaine");
    expect(ongletActif("/seance/de000000-0000-0000-0000-000000000201")).toBe("semaine");
    expect(ongletActif("/saisons")).toBeNull();
  });

  it("la barre reste sur les sous-pages (zones, profil…), pas sur les écrans plein écran", () => {
    for (const c of ["/accueil", "/saison", "/zones", "/profil", "/progres", "/records"]) expect(barreVisible(c), c).toBe(true);
    for (const c of ["/tests", "/abonnement", "/admin", "/connexion", "/bienvenue"]) expect(barreVisible(c), c).toBe(false);
    expect(ongletActif("/zones")).toBeNull();
  });

  it("« Mon profil » est en valeur sur le profil, les zones, les progrès et les records", () => {
    for (const c of ["/profil", "/zones", "/progres", "/records"]) expect(profilActif(c), c).toBe(true);
    for (const c of ["/accueil", "/semaine", "/seance/x", "/profils", "/club"]) expect(profilActif(c), c).toBe(false);
  });

  it("le menu latéral a le logo, les 5 onglets et le profil, onglet en cours marqué", () => {
    const html = renderToStaticMarkup(<MenuLateral />);
    expect(html).toContain('aria-label="Navigation principale"');
    expect(html).toContain("le club");
    for (const o of ONGLETS) expect(html).toContain(`href="${o.chemin}"`);
    expect(html).toContain('href="/profil"');
    expect(html).toContain("Mon profil");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html.match(/<a [^>]*aria-current="page"[^>]*>/)?.[0]).toContain('href="/semaine"');
  });

  it("les aperçus montrent la barre de la vraie page", () => {
    expect(cheminAffiche("/apercu-membre/seance-faite")).toBe("/seance");
    expect(cheminAffiche("/apercu-membre/club-canal")).toBe("/club");
    expect(cheminAffiche("/apercu-membre/accueil")).toBe("/accueil");
    expect(cheminAffiche("/apercu-membre/calculateur-ouvrir")).toBe("/ressources/calculateur");
    expect(cheminAffiche("/apercu-membre/acces-coupe")).toBe("/abonnement");
    expect(barreVisible(cheminAffiche("/apercu-membre/tests-pma"))).toBe(false);
    expect(barreVisible(cheminAffiche("/apercu-membre/conditions"))).toBe(false);
    expect(ongletActif(cheminAffiche("/apercu-membre/saison-vide"))).toBe("semaine");
    expect(cheminAffiche("/semaine")).toBe("/semaine");
    expect(cheminAffiche("/apercu-espace/admin")).toBe("/apercu-espace/admin");
  });

  it("marque l'onglet de la page courante", () => {
    const html = renderToStaticMarkup(<BarreOnglets />);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    const lienActif = html.match(/<a [^>]*aria-current="page"[^>]*>/)?.[0] ?? "";
    expect(lienActif).toContain('href="/semaine"');
    expect(lienActif).toContain("actif");
    expect(html).toContain('aria-label="Navigation principale"');
  });
});

describe("pastille de zone", () => {
  it.each(ZONES)("Z%i a sa couleur et un nom lisible", (z) => {
    const html = renderToStaticMarkup(<PastilleZone zone={z} />);
    expect(html).toContain(`>Z${z}<`);
    expect(html).toContain(`z${z}`);
    expect(html).toMatch(/aria-label="Zone \d, [^"]+"/);
  });

  it("existe en petite taille", () => {
    expect(renderToStaticMarkup(<PastilleZone zone={3} taille="petite" />)).toContain("petite");
  });
});

describe("boutons", () => {
  it("le bouton principal est bloqué et affiche le texte d'attente quand il est en cours", () => {
    const html = renderToStaticMarkup(
      <BoutonPrincipal enCours texteEnCours="Envoi…">
        Envoyer
      </BoutonPrincipal>,
    );
    expect(html).toContain("disabled");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Envoi…");
    expect(html).toContain('type="button"');
  });

  it("devient un lien avec href", () => {
    const html = renderToStaticMarkup(<BoutonSecondaire href="/club">Le club</BoutonSecondaire>);
    expect(html).toMatch(/^<a [^>]*href="\/club"/);
    expect(html).toContain("secondaire");
  });
});

describe("champ de saisie", () => {
  it("relie le libellé, l'aide et l'erreur au champ", () => {
    const html = renderToStaticMarkup(<Champ libelle="FTP" name="ftp" aide="En watts" erreur="Trop élevé" />);
    expect(html).toContain('for="champ-ftp"');
    expect(html).toContain('id="champ-ftp"');
    expect(html).toContain('aria-describedby="champ-ftp-aide champ-ftp-erreur"');
    expect(html).toContain('aria-invalid="true"');
  });
});

describe("carte", () => {
  it("devient un lien entier avec href", () => {
    expect(renderToStaticMarkup(<Carte href="/semaine">Semaine</Carte>)).toMatch(/^<a [^>]*href="\/semaine"/);
  });
  it("accepte une autre balise", () => {
    expect(renderToStaticMarkup(<Carte as="section">x</Carte>)).toMatch(/^<section class="carte/);
  });
});
