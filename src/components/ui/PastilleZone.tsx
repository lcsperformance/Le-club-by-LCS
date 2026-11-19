import styles from "./ui.module.css";

export const ZONES = [1, 2, 3, 4, 5] as const;
export type Zone = (typeof ZONES)[number];

export const NOMS_ZONES: Record<Zone, string> = {
  1: "Récupération",
  2: "Endurance",
  3: "Tempo",
  4: "Seuil",
  5: "Haute intensité",
};

/** Pastille « Z1 » à « Z5 » aux couleurs de la maquette. */
export function PastilleZone({ zone, taille = "normale" }: { zone: Zone; taille?: "normale" | "petite" }) {
  return (
    <span
      className={`${styles.pastille} ${styles[`z${zone}`]} ${taille === "petite" ? styles.petite : ""}`}
      title={`Zone ${zone} : ${NOMS_ZONES[zone]}`}
      aria-label={`Zone ${zone}, ${NOMS_ZONES[zone]}`}
    >
      Z{zone}
    </span>
  );
}
