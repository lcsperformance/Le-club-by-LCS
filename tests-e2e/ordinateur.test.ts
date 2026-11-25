/**
 * Version ordinateur (à partir de 1100 px, src/lib/points-de-rupture.ts) : menu latéral fixe à gauche
 * (logo, 5 onglets, profil ; onglet en cours en valeur), contenu à sa droite et limité à
 * --largeur-contenu, bandeau aligné sur le contenu, fond Neon plein écran.
 * À 1024 px (iPad en paysage), la barre d'onglets reste en bas.
 */
import { chromium, type Browser, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ORDINATEURS } from "./ecrans";
import { BASE } from "./serveur";

let navigateur: Browser;

beforeAll(async () => {
  navigateur = await chromium.launch();
});

afterAll(async () => {
  await navigateur?.close();
});

async function ouvrir(ecran: string, largeur: number, hauteur: number): Promise<Page> {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur } });
  await page.goto(BASE + ecran, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.body.innerText.includes("Chargement…"));
  return page;
}

/** Position du menu, du contenu, du bandeau et du fond. */
const mesurer = (page: Page) =>
  page.evaluate(() => {
    const boite = (e: Element | null) => e?.getBoundingClientRect() ?? null;
    const contenu = [...document.querySelectorAll("main > *")].map((e) => e.getBoundingClientRect());
    const fond = [...document.querySelectorAll("div[aria-hidden]")].find(
      (e) => getComputedStyle(e).position === "fixed" && getComputedStyle(e).zIndex === "-1",
    );
    return {
      rail: boite(
        [...document.querySelectorAll('nav[aria-label="Navigation principale"]')].find(
          (e) => getComputedStyle(e).display !== "none",
        ) ?? null,
      ),
      contenuGauche: Math.min(...contenu.map((r) => r.left)),
      contenuDroite: Math.max(...contenu.map((r) => r.right)),
      bandeau: boite(document.querySelector('a[href="/club/agenda"]')),
      fond: boite(fond ?? null),
      ecran: { largeur: document.documentElement.clientWidth, hauteur: window.innerHeight },
    };
  });

describe.each(ORDINATEURS)("ordinateur de %i × %i px", (largeur, hauteur) => {
  it("menu à gauche, contenu à sa droite, bandeau aligné, fond plein écran", async () => {
    const page = await ouvrir("/apercu-membre/accueil", largeur, hauteur);
    try {
      const m = await mesurer(page);
      expect(m.rail, "le menu latéral est affiché").not.toBeNull();
      const rail = m.rail!;
      expect(rail.left, "rail collé à gauche").toBeLessThan(40);
      expect(rail.height, "rail vertical").toBeGreaterThan(rail.width);
      expect(m.contenuGauche, "le contenu commence après le rail").toBeGreaterThanOrEqual(rail.right + 16);
      expect(m.contenuDroite - m.contenuGauche, "contenu limité à 1100 px").toBeLessThanOrEqual(1100);
      expect(m.contenuDroite, "le contenu tient dans l'écran").toBeLessThanOrEqual(m.ecran.largeur);
      expect(m.bandeau!.left, "le bandeau ne passe pas sous le menu").toBeGreaterThanOrEqual(rail.right);
      expect(m.fond, "fond Neon présent").not.toBeNull();
      expect(m.fond!.width).toBeGreaterThanOrEqual(m.ecran.largeur);
      expect(m.fond!.height).toBeGreaterThanOrEqual(m.ecran.hauteur);
    } finally {
      await page.close();
    }
  });

  it("le contenu est centré dans l'espace à droite du menu", async () => {
    const page = await ouvrir("/apercu-membre/avantages", largeur, hauteur);
    try {
      const m = await mesurer(page);
      const debut = m.rail!.right;
      const gauche = m.contenuGauche - debut;
      const droite = m.ecran.largeur - m.contenuDroite;
      expect(Math.abs(gauche - droite), `marges ${gauche} / ${droite}`).toBeLessThanOrEqual(m.rail!.left + 2);
    } finally {
      await page.close();
    }
  });

  it("écran plein écran (tests) : pas de menu, contenu centré", async () => {
    const page = await ouvrir("/apercu-membre/tests", largeur, hauteur);
    try {
      const m = await mesurer(page);
      expect(m.rail).toBeNull();
      expect(Math.abs(m.contenuGauche - (m.ecran.largeur - m.contenuDroite))).toBeLessThanOrEqual(2);
    } finally {
      await page.close();
    }
  });
});

/** Boîte d'un élément de la page. */
const boite = (page: Page, selecteur: string) =>
  page.locator(selecteur).first().evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { gauche: r.left, droite: r.right, haut: r.top, largeur: r.width };
  });

describe.each(ORDINATEURS)("écrans en deux colonnes à %i × %i px", (largeur, hauteur) => {
  it("accueil : cartes en grille de 2, en-tête sans débordement", async () => {
    const page = await ouvrir("/apercu-membre/accueil", largeur, hauteur);
    try {
      const grille = await page.evaluate(() => {
        const g = [...document.querySelectorAll("main *")].find(
          (e) => getComputedStyle(e).display === "grid" && getComputedStyle(e).gridTemplateColumns.split(" ").length === 2,
        );
        return [...(g?.children ?? [])].slice(0, 2).map((e) => e.getBoundingClientRect().toJSON() as DOMRect);
      });
      expect(grille, "une grille de 2 cartes").toHaveLength(2);
      expect(grille[0].top, "deux cartes sur la même ligne").toBe(grille[1].top);
      expect(grille[0].right).toBeLessThan(grille[1].left);
      const entete = await boite(page, "header");
      const contenu = await boite(page, 'section[aria-labelledby="etape-tests"]');
      expect(entete.gauche, "l'en-tête est aligné sur le contenu").toBe(contenu.gauche);
      expect(await page.locator("header").getByText("le club").isVisible(), "logo seulement dans le menu").toBe(false);
      expect(await page.locator("main header a[href='/profil']").isVisible(), "profil seulement dans le menu").toBe(false);
    } finally {
      await page.close();
    }
  });

  it("Ma semaine : les 7 jours à gauche, le jour choisi et ses séances à droite", async () => {
    const page = await ouvrir("/apercu-membre/semaine", largeur, hauteur);
    try {
      const jours = await boite(page, '[aria-label="Jours de la semaine"]');
      const titreJour = await boite(page, "main h2");
      expect(jours.droite).toBeLessThan(titreJour.gauche);
      const avant = await page.locator("main h2").first().innerText();
      await page.locator('[aria-label="Jours de la semaine"] button[aria-pressed="false"]').first().click();
      await expect.poll(() => page.locator("main h2").first().innerText()).not.toBe(avant);
    } finally {
      await page.close();
    }
  });

  it("Séance : les blocs à gauche, le suivi (RPE, ressenti) à droite", async () => {
    const page = await ouvrir("/apercu-membre/seance-faite", largeur, hauteur);
    try {
      const blocs = await boite(page, "main ol");
      const ressenti = await boite(page, 'section[aria-labelledby="titre-ressenti"]');
      expect(blocs.droite).toBeLessThan(ressenti.gauche);
      expect(ressenti.haut, "le suivi commence en haut de la page").toBeLessThan(blocs.haut + 200);
    } finally {
      await page.close();
    }
  });

  it("Séance sans suivi : une colonne de 720 px au plus", async () => {
    const page = await ouvrir("/apercu-membre/seance-verrouillee", largeur, hauteur);
    try {
      expect((await boite(page, "main ol")).largeur).toBeLessThanOrEqual(720);
    } finally {
      await page.close();
    }
  });
});

describe.each(ORDINATEURS)("profil, zones, progrès, saison, tests, records à %i × %i px", (largeur, hauteur) => {
  /** Courbe visible : plus large que haute, points ronds (pas de déformation). */
  const mesurerCourbe = (page: Page) =>
    page.getByRole("img", { name: /^Courbe de ta/ }).evaluate((svg) => {
      const r = svg.getBoundingClientRect();
      const point = svg.querySelector("circle")!.getBoundingClientRect();
      return { largeur: r.width, hauteur: r.height, pointL: point.width, pointH: point.height, gauche: r.left, droite: r.right };
    });

  it("Mes progrès : grande courbe large à gauche, historique à droite", async () => {
    const page = await ouvrir("/apercu-membre/progres", largeur, hauteur);
    try {
      const c = await mesurerCourbe(page);
      expect(c.largeur / c.hauteur, "courbe en format large").toBeGreaterThan(2.5);
      expect(Math.abs(c.pointL - c.pointH), "points ronds").toBeLessThan(0.5);
      expect(c.largeur, "la courbe profite de la largeur").toBeGreaterThan(450);
      const historique = await boite(page, 'section[aria-label="Historique des tests"]');
      expect(c.droite).toBeLessThan(historique.gauche);
    } finally {
      await page.close();
    }
  });

  it("Mes zones : zones à gauche, courbe de progrès du sport à droite", async () => {
    const page = await ouvrir("/apercu-membre/zones-course", largeur, hauteur);
    try {
      const zones = await boite(page, "main >> text=Récupération");
      const c = await mesurerCourbe(page);
      expect(zones.droite).toBeLessThan(c.gauche);
      expect(Math.abs(c.pointL - c.pointH), "points ronds").toBeLessThan(0.5);
    } finally {
      await page.close();
    }
  });

  it("Ma saison : objectifs à gauche, calendrier de la saison à droite", async () => {
    const page = await ouvrir("/apercu-membre/saison", largeur, hauteur);
    try {
      const objectifs = await boite(page, 'section[aria-labelledby="titre-objectifs"]');
      const calendrier = await boite(page, 'section[aria-labelledby="titre-calendrier"]');
      expect(objectifs.droite).toBeLessThan(calendrier.gauche);
      expect(Math.abs(objectifs.haut - calendrier.haut)).toBeLessThan(40);
    } finally {
      await page.close();
    }
  });

  it("Profil : deux colonnes (niveau à gauche, notifications à droite)", async () => {
    const page = await ouvrir("/apercu-membre/profil", largeur, hauteur);
    try {
      const gauche = await boite(page, "main input");
      const droite = await page.getByRole("link", { name: /Mes records/ }).evaluate((e) => e.getBoundingClientRect().left);
      expect(gauche.droite).toBeLessThan(droite);
    } finally {
      await page.close();
    }
  });

  it.each(["/apercu-membre/tests", "/apercu-membre/records"])("%s : colonne de 720 px au plus, cartes 2 par 2", async (ecran) => {
    const page = await ouvrir(ecran, largeur, hauteur);
    try {
      const largeurs = await page.evaluate(() => {
        const g = [...document.querySelectorAll("main *")].find(
          (e) => getComputedStyle(e).display === "grid" && getComputedStyle(e).gridTemplateColumns.split(" ").length === 2,
        )!;
        const enfants = [...g.children].map((e) => e.getBoundingClientRect());
        return { grille: g.getBoundingClientRect().width, memeLigne: enfants[0].top === enfants[1].top };
      });
      expect(largeurs.grille).toBeLessThanOrEqual(720);
      expect(largeurs.memeLigne).toBe(true);
    } finally {
      await page.close();
    }
  });
});

describe.each(ORDINATEURS)("Club, agenda, ressources, avantages à %i × %i px", (largeur, hauteur) => {
  /** Nombre de cartes sur la première ligne d'une liste. */
  const parLigne = (page: Page, selecteur: string) =>
    page.locator(selecteur).first().evaluate((liste) => {
      const tops = [...liste.children].map((e) => Math.round(e.getBoundingClientRect().top));
      return tops.filter((t) => t === tops[0]).length;
    });

  it("canal : la liste des canaux à gauche, le fil et la zone d'envoi à droite", async () => {
    const page = await ouvrir("/apercu-membre/club-canal", largeur, hauteur);
    try {
      const actif = await boite(page, 'main a[aria-current="page"][href^="/club/"]');
      const fil = await boite(page, 'section[aria-label^="Messages de #"]');
      const envoi = await boite(page, '[aria-label="Ton message"]');
      expect(actif.droite).toBeLessThan(fil.gauche);
      expect(envoi.gauche).toBeGreaterThan(actif.droite);
      expect(await page.locator('[aria-label="Ton message"]').isVisible()).toBe(true);
    } finally {
      await page.close();
    }
  });

  it("Club : la liste à gauche, « Choisis un canal » à droite", async () => {
    const page = await ouvrir("/apercu-membre/club", largeur, hauteur);
    try {
      const liste = await boite(page, 'main a[href="/club/general"]');
      const invitation = await boite(page, "main >> text=Choisis un canal pour lire et écrire.");
      expect(liste.droite).toBeLessThan(invitation.gauche);
    } finally {
      await page.close();
    }
  });

  it("boîte à questions : formulaire à gauche, questions à droite", async () => {
    const page = await ouvrir("/apercu-membre/club-questions", largeur, hauteur);
    try {
      const champ = await boite(page, "#champ-question");
      const compte = await boite(page, "main h2 >> text=/déposée/");
      expect(champ.droite).toBeLessThan(compte.gauche);
    } finally {
      await page.close();
    }
  });

  it("agenda : calendrier mensuel à gauche, événements à droite", async () => {
    const page = await ouvrir("/apercu-membre/club-agenda", largeur, hauteur);
    try {
      const calendrier = await boite(page, 'main [aria-label="Mois suivant"]');
      const titre = await boite(page, "main h2 >> text=/Ce mois-ci/");
      expect(calendrier.droite).toBeLessThan(titre.gauche);
    } finally {
      await page.close();
    }
  });

  it("ressources : thèmes sur 4 colonnes, contenus d'un thème en grille", async () => {
    const page = await ouvrir("/apercu-membre/ressources", largeur, hauteur);
    try {
      expect(await parLigne(page, "main ul")).toBe(4);
    } finally {
      await page.close();
    }
    const theme = await ouvrir("/apercu-membre/ressources-theme", largeur, hauteur);
    try {
      const colonnes = await theme
        .locator("main section ul")
        .first()
        .evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
      expect(colonnes).toBe(largeur >= 1440 ? 3 : 2);
    } finally {
      await theme.close();
    }
  });

  it("vidéo : le contenu à gauche, les commentaires à droite", async () => {
    const page = await ouvrir("/apercu-membre/ressources-video", largeur, hauteur);
    try {
      const titre = await boite(page, "main h1");
      const commentaires = await boite(page, 'section[aria-labelledby="titre-commentaires"]');
      expect(titre.droite).toBeLessThan(commentaires.gauche);
    } finally {
      await page.close();
    }
  });

  it("avantages : partenaires en grille", async () => {
    const page = await ouvrir("/apercu-membre/avantages", largeur, hauteur);
    try {
      const colonnes = await page.locator("main ul").first().evaluate((ul) => getComputedStyle(ul).gridTemplateColumns.split(" ").length);
      expect(colonnes).toBe(largeur >= 1440 ? 3 : 2);
      expect(await parLigne(page, "main ul")).toBe(2);
    } finally {
      await page.close();
    }
  });
});

describe.each(ORDINATEURS)("connexion, abonnement, pages légales à %i × %i px", (largeur, hauteur) => {
  it.each(["/connexion", "/mot-de-passe-oublie", "/bienvenue"])(
    "%s : fond sur tout l'écran, décors masqués, colonne centrée, « le club » sur une ligne",
    async (ecran) => {
      const page = await ouvrir(ecran, largeur, hauteur);
      try {
        const m = await page.evaluate(() => {
          const ecran = document.querySelector("main")!.getBoundingClientRect();
          const titre = document.querySelector("h1")!.getBoundingClientRect();
          const club = [...document.querySelectorAll(".logo")].find((e) => e.textContent?.includes("club"))!.getBoundingClientRect();
          const decors = [...document.querySelectorAll("main > div[aria-hidden]")].filter((e) => getComputedStyle(e).display !== "none");
          return { ecran: ecran.width, gauche: titre.left, droite: titre.right, clubHauteur: club.height, decors: decors.length };
        });
        expect(m.ecran, "le fond couvre la largeur").toBeGreaterThanOrEqual(largeur - 20);
        expect(m.decors, "décors masqués").toBe(0);
        expect(m.droite - m.gauche, "colonne de 440 px au plus").toBeLessThanOrEqual(440);
        expect(Math.abs(m.gauche + (m.droite - m.gauche) / 2 - largeur / 2), "colonne centrée").toBeLessThan(230);
        expect(m.clubHauteur, "« le club » sur une ligne").toBeLessThan(70);
      } finally {
        await page.close();
      }
    },
  );

  it("abonnement : les deux formules côte à côte dans 720 px", async () => {
    const page = await ouvrir("/apercu-membre/abonnement-termine", largeur, hauteur);
    try {
      const mensuelle = await boite(page, "main >> text=/réabonner · 49/");
      const annuelle = await boite(page, "main >> text=/à l'année/");
      expect(mensuelle.droite).toBeLessThan(annuelle.gauche);
      expect(Math.abs(mensuelle.haut - annuelle.haut)).toBeLessThan(10);
      const section = await boite(page, 'section[aria-labelledby="titre-formule"]');
      expect(section.largeur).toBeLessThanOrEqual(720);
    } finally {
      await page.close();
    }
  });

  it("CGV : colonne de lecture de 720 px au plus, centrée", async () => {
    const page = await ouvrir("/cgv", largeur, hauteur);
    try {
      const article = await boite(page, "article");
      expect(article.largeur).toBeLessThanOrEqual(720);
      expect(Math.abs(article.gauche - (largeur - article.droite))).toBeLessThan(20);
    } finally {
      await page.close();
    }
  });
});

describe("iPad en paysage (1024 px)", () => {
  it("la barre d'onglets reste en bas", async () => {
    const page = await ouvrir("/apercu-membre/accueil", 1024, 768);
    try {
      const { rail } = await mesurer(page);
      expect(rail!.width).toBeGreaterThan(rail!.height);
      expect(rail!.bottom).toBeGreaterThan(700);
    } finally {
      await page.close();
    }
  });
});
