import { describe, expect, it } from "vitest";
import {
  badgeNonLus,
  canalDuBloc,
  fusionnerMessages,
  groupesParJour,
  heureMessage,
  initialeAuteur,
  jourMessage,
  libelleRole,
  lireMessage,
  lireMessageRecu,
  peutEcrire,
  retirerMessage,
  type Message,
} from "@/lib/club";

const m = (id: string, cree_le: string, texte = `Message ${id}`): Message => ({
  id,
  canal: "general",
  membre_id: "a",
  auteur: "Hugo",
  auteur_role: "membre",
  texte,
  cree_le,
});

describe("écrire", () => {
  it("un message de 1 à 1 000 caractères", () => {
    expect(lireMessage("  Salut le Club !  ")).toEqual({ texte: "Salut le Club !" });
    expect(lireMessage("   ")).toEqual({ erreur: "Écris ton message avant de l'envoyer." });
    expect(lireMessage("x".repeat(1001))).toEqual({ erreur: "Ton message dépasse 1000 caractères." });
  });

  it("annonces : seuls l'admin et le coach publient ; les autres canaux sont ouverts à tous", () => {
    const annonces = { lecture_seule: true };
    expect(peutEcrire(annonces, "membre")).toBe(false);
    expect(peutEcrire(annonces, "coach")).toBe(true);
    expect(peutEcrire(annonces, "admin")).toBe(true);
    expect(peutEcrire({ lecture_seule: false }, "membre")).toBe(true);
  });
});

describe("affichage", () => {
  it("badge de non-lus : rien, le nombre, ou 99+", () => {
    expect(badgeNonLus(0)).toBeNull();
    expect(badgeNonLus(3)).toBe("3");
    expect(badgeNonLus(128)).toBe("99+");
  });

  it("étiquette du coach et de l'équipe, rien pour un membre", () => {
    expect(libelleRole("coach")).toBe("Coach");
    expect(libelleRole("admin")).toBe("Équipe du Club");
    expect(libelleRole("membre")).toBeNull();
  });

  it("« Mon bloc » : bloc-m ou bloc-l selon le bloc en cours", () => {
    expect(canalDuBloc("M")).toBe("bloc-m");
    expect(canalDuBloc("L")).toBe("bloc-l");
    expect(canalDuBloc("S")).toBeNull();
    expect(canalDuBloc(null)).toBeNull();
  });

  it("initiale, heure et jour à la française, à l'heure de Paris", () => {
    expect(initialeAuteur("élodie")).toBe("É");
    expect(heureMessage("2027-01-11T13:30:00Z")).toBe("14 h 30");
    // 22 h 30 UTC = 23 h 30 à Paris, encore le 11 ; 23 h 30 UTC = 0 h 30 le 12 à Paris.
    expect(jourMessage("2027-01-11T22:30:00Z", "2027-01-11")).toBe("Aujourd'hui");
    expect(jourMessage("2027-01-11T23:30:00Z", "2027-01-12")).toBe("Aujourd'hui"); // 0 h 30 le 12 à Paris
    expect(jourMessage("2027-01-11T08:00:00Z", "2027-01-11")).toBe("Aujourd'hui");
    expect(jourMessage("2027-01-10T08:00:00Z", "2027-01-11")).toBe("Hier");
    expect(jourMessage("2026-11-18T08:00:00Z", "2027-01-11")).toBe("18/11/2026");
  });
});

describe("fil en direct", () => {
  it("fusionne sans doublon, du plus ancien au plus récent", () => {
    const fil = [m("1", "2027-01-11T08:00:00Z"), m("2", "2027-01-11T09:00:00Z")];
    // Le message envoyé revient aussi par le direct : une seule fois.
    const apres = fusionnerMessages(fil, [m("3", "2027-01-11T10:00:00Z"), m("2", "2027-01-11T09:00:00Z"), m("0", "2027-01-10T20:00:00Z")]);
    expect(apres.map((x) => x.id)).toEqual(["0", "1", "2", "3"]);
  });

  it("retire un message supprimé", () => {
    expect(retirerMessage([m("1", "2027-01-11T08:00:00Z"), m("2", "2027-01-11T09:00:00Z")], "1").map((x) => x.id)).toEqual(["2"]);
  });

  it("regroupe par jour", () => {
    const g = groupesParJour([m("2", "2027-01-11T09:00:00Z"), m("1", "2027-01-10T09:00:00Z"), m("3", "2027-01-11T10:00:00Z")], "2027-01-11");
    expect(g.map((x) => [x.jour, x.messages.map((y) => y.id)])).toEqual([
      ["Hier", ["1"]],
      ["Aujourd'hui", ["2", "3"]],
    ]);
  });

  it("ignore un message reçu incomplet", () => {
    expect(lireMessageRecu({ id: "1", canal: "general" })).toBeNull();
    expect(lireMessageRecu(m("1", "2027-01-11T09:00:00Z"))).toEqual(m("1", "2027-01-11T09:00:00Z"));
  });
});
