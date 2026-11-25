/**
 * Chaque écran tient sur un ordinateur (souris, pas d'écran tactile) : petite fenêtre de 1024 px
 * (encore l'affichage iPad), 1100 px (début de la version ordinateur), puis 1280, 1440 et 1920 px.
 */
import { describe, it } from "vitest";
import { preparerNavigateur, verifierDebordement } from "./debordement";
import { DEBUT_ORDINATEUR, ECRANS, ORDINATEURS, PETIT_ORDINATEUR } from "./ecrans";

preparerNavigateur();

describe.each([PETIT_ORDINATEUR, DEBUT_ORDINATEUR, ...ORDINATEURS])("ordinateur de %i × %i px", (largeur, hauteur) => {
  it.each(ECRANS)("%s ne déborde pas", (ecran) => verifierDebordement(ecran, largeur, hauteur, {}));
});
