import type { MetadataRoute } from "next";
import { COULEUR_FOND, NOM_APP, NOM_COURT_APP } from "@/lib/installation";

/** Fiche de l'application installable (nom, icône, plein écran, couleurs du Club). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: NOM_APP,
    short_name: NOM_COURT_APP,
    description: "Le club d'entraînement triathlon du coach Martin.",
    lang: "fr",
    dir: "ltr",
    start_url: "/accueil",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: COULEUR_FOND,
    theme_color: COULEUR_FOND,
    icons: [
      { src: "/icones/icone-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icones/icone-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
