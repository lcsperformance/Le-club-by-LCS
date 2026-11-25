/** Chaque écran tient sur un téléphone de 320, 360 et 390 px de large. */
import { describe, it } from "vitest";
import { preparerNavigateur, tactile, verifierDebordement } from "./debordement";
import { ECRANS, TELEPHONES } from "./ecrans";

preparerNavigateur();

describe.each(TELEPHONES)("téléphone de %i px de large", (largeur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifierDebordement(ecran, largeur, 780, tactile));
});
