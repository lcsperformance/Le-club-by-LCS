/** Chaque écran tient sur l'iPad, en portrait (768 × 1024) et en paysage (1024 × 768). */
import { describe, it } from "vitest";
import { preparerNavigateur, tactile, verifierDebordement } from "./debordement";
import { ECRANS, TABLETTES } from "./ecrans";

preparerNavigateur();

describe.each(TABLETTES)("iPad de %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifierDebordement(ecran, largeur, hauteur, tactile));
});
