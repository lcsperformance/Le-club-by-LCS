import { BarreOnglets } from "@/components/BarreOnglets";
import { FondNeon } from "@/components/FondNeon";

/** Espace membre : fond Neon, contenu centré façon téléphone, barre d'onglets flottante. */
export default function LayoutMembre({ children }: LayoutProps<"/">) {
  return (
    <>
      <FondNeon />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "22px 20px 0", display: "grid", gap: 16 }}>
        {children}
      </main>
      <BarreOnglets />
    </>
  );
}
