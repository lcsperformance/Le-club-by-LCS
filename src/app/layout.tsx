import type { Metadata, Viewport } from "next";
import "./globals.css";
import { classesPolices } from "./polices";
import { EnregistrementApp } from "@/components/EnregistrementApp";
import { COULEUR_FOND, imagesDemarrage, NOM_APP, NOM_COURT_APP } from "@/lib/installation";

export const metadata: Metadata = {
  title: NOM_APP,
  description: "Le club d'entraînement triathlon du coach Martin.",
  applicationName: NOM_APP,
  // iPhone : ouverture en plein écran depuis l'icône, titre sous l'icône, écran de démarrage du Club.
  appleWebApp: {
    capable: true,
    title: NOM_COURT_APP,
    statusBarStyle: "black",
    startupImage: imagesDemarrage(),
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: COULEUR_FOND,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={classesPolices}>
      <body>
        {children}
        <EnregistrementApp />
      </body>
    </html>
  );
}
