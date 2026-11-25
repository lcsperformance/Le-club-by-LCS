import { Suspense } from "react";
import { BarreOnglets } from "@/components/BarreOnglets";
import { FondNeon } from "@/components/FondNeon";
import { MenuLateral } from "@/components/MenuLateral";
import { ProchainEvenement } from "@/components/ProchainEvenement";
import styles from "./layout.module.css";

/**
 * Espace membre : fond Neon, bandeau du prochain événement en haut, contenu centré façon téléphone
 * (élargi sur ordinateur), barre d'onglets flottante (menu latéral sur ordinateur).
 */
export default function LayoutMembre({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      {/* Le bandeau lit l'agenda (session du membre) : il doit être sous Suspense. */}
      <Suspense fallback={null}>
        <ProchainEvenement />
      </Suspense>
      <main className={styles.contenu}>{children}</main>
      {/* La barre et le menu lisent l'adresse de la page : ils doivent être sous Suspense. */}
      <Suspense fallback={null}>
        <BarreOnglets />
        <MenuLateral />
      </Suspense>
    </>
  );
}
