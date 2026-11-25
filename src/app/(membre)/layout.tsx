import { Suspense } from "react";
import { BarreOnglets } from "@/components/BarreOnglets";
import { FondNeon } from "@/components/FondNeon";
import { ProchainEvenement } from "@/components/ProchainEvenement";
import styles from "./layout.module.css";

/**
 * Espace membre : fond Neon, bandeau du prochain événement en haut, contenu centré façon téléphone
 * (élargi sur ordinateur), barre d'onglets flottante (rail latéral sur ordinateur).
 */
export default function LayoutMembre({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      {/* Le bandeau lit l'agenda (session du membre) : il doit être sous Suspense. */}
      <Suspense fallback={null}>
        <ProchainEvenement />
      </Suspense>
      <main className={styles.contenu}>
        {children}
      </main>
      {/* La barre lit l'adresse de la page : elle doit être sous Suspense. */}
      <Suspense fallback={null}>
        <BarreOnglets />
      </Suspense>
    </>
  );
}
