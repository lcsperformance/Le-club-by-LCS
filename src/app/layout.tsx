import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Le Club by LCS",
  description: "Le club d'entraînement triathlon du coach Martin.",
};

export const viewport: Viewport = {
  themeColor: "#090A0F",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
