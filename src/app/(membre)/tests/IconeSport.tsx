import type { CleMesure } from "@/lib/tests-depart";

const TRACES: Record<CleMesure, React.ReactNode> = {
  allure_seuil_course: (
    <>
      <circle cx="14" cy="5" r="2" />
      <path d="M10 21l2-5-3-3 2-5 4 2 3 2M8 10l-3 3M12 16l4 1 1 4" />
    </>
  ),
  ftp: (
    <>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16l4-8h5l3 8M10 8l5 8M13 6h3" />
    </>
  ),
  pma_5min: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5M10 2h4" />
    </>
  ),
  vitesse_critique_natation: (
    <>
      <path d="M2 16c2 0 2-1.5 4-1.5S8 16 10 16s2-1.5 4-1.5S16 16 18 16s2-1.5 4-1.5" />
      <path d="M2 20c2 0 2-1.5 4-1.5S8 20 10 20s2-1.5 4-1.5S16 20 18 20s2-1.5 4-1.5" />
      <circle cx="16" cy="6" r="2" />
      <path d="M6 12l4-3 3 2 3-1" />
    </>
  ),
  fc_seuil: <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.5-7 10-7 10z" />,
};

/** Pictogramme du sport dans sa pastille, comme sur la maquette. */
export function IconeSport({ cle }: { cle: CleMesure }) {
  return (
    <span
      aria-hidden
      style={{
        width: 44,
        height: 44,
        flex: "none",
        borderRadius: 14,
        background: "rgba(250, 148, 255, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {TRACES[cle]}
      </svg>
    </span>
  );
}
