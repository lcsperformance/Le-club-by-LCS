import { describe, expect, it } from "vitest";
import { choixDuCompte, comptesAffiches, estChoixRole, libelleChoix, type CompteEquipe } from "@/lib/admin/equipe";

const c = (id: string, prenom: string, role: CompteEquipe["role"], affiche_coach = false): CompteEquipe => ({
  id,
  email: `${prenom.toLowerCase()}@exemple.fr`,
  prenom,
  nom: null,
  role,
  affiche_coach,
});

describe("rôles de l'équipe", () => {
  it("un admin présenté comme coach est « Coach + admin »", () => {
    expect(choixDuCompte({ role: "admin", affiche_coach: true })).toBe("coach_admin");
    expect(choixDuCompte({ role: "admin", affiche_coach: false })).toBe("admin");
    expect(choixDuCompte({ role: "coach", affiche_coach: true })).toBe("coach");
    expect(libelleChoix("coach_admin")).toBe("Coach + admin");
  });

  it("seuls les 4 choix existent", () => {
    expect(["membre", "coach", "coach_admin", "admin"].every(estChoixRole)).toBe(true);
    expect(estChoixRole("superadmin")).toBe(false);
  });

  it("l'équipe d'abord ; les membres seulement quand on cherche", () => {
    const comptes = [c("1", "Zoé", "membre"), c("2", "Martin", "admin", true), c("3", "Julie", "coach"), c("4", "Élodie", "membre")];
    expect(comptesAffiches(comptes, "").map((x) => x.prenom)).toEqual(["Julie", "Martin"]);
    expect(comptesAffiches(comptes, "elodie").map((x) => x.prenom)).toEqual(["Élodie"]);
    expect(comptesAffiches(comptes, "exemple").map((x) => x.prenom)).toEqual(["Julie", "Martin", "Élodie", "Zoé"]);
  });
});
