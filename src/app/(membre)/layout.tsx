import { Suspense } from "react";
import { BarreOnglets } from "@/components/BarreOnglets";
import { FondNeon } from "@/components/FondNeon";
import { HabillageOrdinateur } from "@/components/HabillageOrdinateur";
import habillage from "@/components/HabillageOrdinateur.module.css";
import { ProchainEvenement } from "@/components/ProchainEvenement";

/**
 * Espace membre : fond Neon, bandeau du prochain événement en haut, contenu centré façon téléphone,
 * barre d'onglets flottante.
 */
export default function LayoutMembre({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      <HabillageOrdinateur />
      <div className={habillage.colonne}>
        {/* Le bandeau lit l'agenda (session du membre) : il doit être sous Suspense. */}
        <Suspense fallback={null}>
          <ProchainEvenement />
        </Suspense>
        <main style={{ maxWidth: 480, margin: "0 auto", padding: "22px 20px 0", display: "grid", gap: 16 }}>
          {children}
        </main>
      </div>
      {/* La barre lit l'adresse de la page : elle doit être sous Suspense. */}
      <Suspense fallback={null}>
        <BarreOnglets />
      </Suspense>
    </>
  );
}
