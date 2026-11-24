import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Evenement } from "@/lib/agenda";
import { estCheminPublic } from "@/lib/roles";
import {
  carteNotifications,
  destinataires,
  faqARappeler,
  lireAppareil,
  notificationAnnonce,
  notificationRappelFaq,
  type MembreNotifiable,
} from "@/lib/notifications";

describe("carte « Activer les notifications » (accueil, après la connexion)", () => {
  const base = { priseEnCharge: true, permission: "default" as NotificationPermission, abonne: false, apple: false, installee: false, fermee: false };

  it("propose d'activer tant que le membre n'a rien décidé", () => {
    expect(carteNotifications(base)).toBe("activer");
  });

  it("rien si c'est déjà fait, refusé, fermé, ou si l'appareil ne sait pas", () => {
    expect(carteNotifications({ ...base, permission: "granted", abonne: true })).toBeNull();
    expect(carteNotifications({ ...base, permission: "denied" })).toBeNull();
    expect(carteNotifications({ ...base, fermee: true })).toBeNull();
    expect(carteNotifications({ ...base, priseEnCharge: false })).toBeNull();
  });

  it("autorisé mais cet appareil n'est pas (plus) enregistré : on repropose", () => {
    expect(carteNotifications({ ...base, permission: "granted", abonne: false })).toBe("activer");
  });

  it("iPhone et iPad dans Safari : installer d'abord ; dans l'app installée : activer", () => {
    expect(carteNotifications({ ...base, apple: true, priseEnCharge: false })).toBe("installer-d-abord");
    expect(carteNotifications({ ...base, apple: true, installee: true })).toBe("activer");
  });

  it("le composant ne demande l'autorisation qu'au toucher d'un bouton, jamais au chargement", () => {
    const lire = (f: string) => readFileSync(join(__dirname, "..", f), "utf8");
    const navigateur = lire("src/lib/notifications-navigateur.ts");
    // Une seule demande d'autorisation, dans la fonction appelée par le bouton « Activer ».
    expect(navigateur.match(/requestPermission/g)).toHaveLength(1);
    expect(navigateur).toMatch(/export async function activerSurCetAppareil[\s\S]*requestPermission/);
    for (const f of ["src/components/CarteNotifications.tsx", "src/components/ReglagesNotifications.tsx"]) {
      const code = lire(f);
      expect(code).not.toContain("requestPermission");
      const effet = code.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[apercu\]\);/)?.[0] ?? "";
      expect(effet).not.toContain("activerSurCetAppareil");
    }
  });
});

describe("appareil envoyé par le navigateur", () => {
  const ok = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BNc", auth: "tBH" } };

  it("garde l'adresse et les deux clés", () => {
    expect(lireAppareil(ok)).toEqual({ endpoint: ok.endpoint, p256dh: "BNc", auth: "tBH" });
  });

  it.each([
    ["sans https", { ...ok, endpoint: "http://exemple.fr" }],
    ["sans clés", { endpoint: ok.endpoint }],
    ["adresse trop longue", { ...ok, endpoint: `https://${"a".repeat(1000)}` }],
    ["n'importe quoi", "abc"],
  ])("refuse %s", (_, v) => {
    expect(lireAppareil(v)).toBeNull();
  });
});

describe("contenu des notifications", () => {
  it("annonce : auteur, début du message, ouvre le canal annonces", () => {
    const n = notificationAnnonce({ id: "m1", texte: "Nouvelle   vidéo  nutrition !", auteur: "Martin" });
    expect(n).toEqual({ titre: "Annonce de Martin", corps: "Nouvelle vidéo nutrition !", url: "/club/annonces", etiquette: "annonce-m1" });
    expect(notificationAnnonce({ id: "m2", texte: "x".repeat(300), auteur: null }).corps).toHaveLength(140);
  });

  it("rappel FAQ : la veille, heure de Paris, ouvre la boîte à questions", () => {
    expect(notificationRappelFaq({ id: "f1", titre: "FAQ en visio", debut: "2027-01-14T18:30:00.000Z" })).toEqual({
      titre: "FAQ en visio demain",
      corps: "Rendez-vous demain à 19 h 30. Il est encore temps de poser ta question.",
      url: "/club/questions",
      etiquette: "faq-f1",
    });
  });
});

describe("FAQ à rappeler la veille au soir", () => {
  const ev = (id: string, debut: string, autres: Partial<Evenement> = {}): Evenement => ({
    id, titre: "FAQ en visio", type: "faq", debut, fin: null, lieu: null, lien: null, description: null, dates_a_confirmer: false, periode: null, ...autres,
  });
  // Mercredi 13 janvier 2027, 18 h à Paris (tâche du soir).
  const soir = new Date("2027-01-13T17:00:00Z");

  it("les FAQ de demain (date de Paris), une seule fois", () => {
    const demain = ev("a", "2027-01-14T18:30:00Z");
    const apresDemain = ev("b", "2027-01-15T18:30:00Z");
    const webinaire = ev("c", "2027-01-14T19:00:00Z", { type: "webinaire" });
    const aConfirmer = ev("d", "2027-01-14T18:30:00Z", { dates_a_confirmer: true });
    expect(faqARappeler([demain, apresDemain, webinaire, aConfirmer], soir, new Set()).map((e) => e.id)).toEqual(["a"]);
    expect(faqARappeler([demain], soir, new Set(["a"]))).toEqual([]);
  });

  it("une FAQ demain à 0 h 30 (Paris) compte pour demain, même si c'est encore aujourd'hui en UTC", () => {
    expect(faqARappeler([ev("e", "2027-01-13T23:30:00Z")], soir, new Set()).map((e) => e.id)).toEqual(["e"]);
  });
});

describe("destinataires", () => {
  const maintenant = new Date("2027-01-13T17:00:00Z");
  const m = (id: string, autres: Partial<MembreNotifiable> = {}): MembreNotifiable => ({
    id, role: "membre", abonnement_fin: "2027-02-01T00:00:00Z", acces_offert_jusqua: null, acces_coupe: false, notif_annonces: true, notif_faq: true, ...autres,
  });

  it("membres à jour qui ont gardé ce réglage, équipe comprise, jamais l'auteur", () => {
    const membres = [
      m("a"),
      m("sansAnnonces", { notif_annonces: false }),
      m("termine", { abonnement_fin: "2027-01-01T00:00:00Z" }),
      m("coupe", { acces_coupe: true }),
      m("offert", { abonnement_fin: null, acces_offert_jusqua: "2027-03-01T00:00:00Z" }),
      m("martin", { role: "coach", abonnement_fin: null }),
    ];
    expect(destinataires(membres, "annonces", maintenant, "martin")).toEqual(["a", "offert"]);
    expect(destinataires(membres, "faq", maintenant)).toEqual(["a", "sansAnnonces", "offert", "martin"]);
  });
});

describe("tâche du soir et petit programme", () => {
  it("la route des rappels est joignable par Vercel (sans session), protégée par son secret", () => {
    expect(estCheminPublic("/api/rappels-faq")).toBe(true);
    const route = readFileSync(join(__dirname, "..", "src/app/api/rappels-faq/route.ts"), "utf8");
    expect(route).toContain("Bearer ${secret}");
    const vercel = JSON.parse(readFileSync(join(__dirname, "..", "vercel.json"), "utf8"));
    expect(vercel.crons).toEqual([{ path: "/api/rappels-faq", schedule: "0 17 * * *" }]);
  });

  it("sw.js affiche la notification et n'ouvre que des pages du Club", () => {
    const sw = readFileSync(join(__dirname, "..", "public/sw.js"), "utf8");
    expect(sw).toContain('addEventListener("push"');
    expect(sw).toContain('addEventListener("notificationclick"');
    expect(sw).toContain('n.url.startsWith("/") && !n.url.startsWith("//")');
  });
});
