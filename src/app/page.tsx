import { formatDateFr } from "@/lib/dates";

const LANCEMENT = new Date("2027-01-01T00:00:00+01:00");

export default function Accueil() {
  return (
    <main style={{ padding: "48px 24px", display: "grid", gap: 12 }}>
      <h1 style={{ color: "var(--aurore)" }}>Le Club by LCS</h1>
      <p>Lancement le {formatDateFr(LANCEMENT)}.</p>
    </main>
  );
}
