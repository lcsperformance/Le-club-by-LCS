/** Symbole du Club : le C incliné aux coupes de vitesse (logo D). Source : marque/logo-club-symbole.svg. */
export function SymboleClub({ hauteur = 30 }: { hauteur?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={hauteur}
      height={hauteur}
      aria-hidden
      focusable="false"
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <mask id="masque-symbole-club" maskUnits="userSpaceOnUse" x="-50" y="-20" width="320" height="240">
          <rect x="-50" y="-20" width="320" height="240" fill="#fff" />
          <rect x="0" y="72" width="82" height="8" fill="#000" />
          <rect x="0" y="96" width="82" height="8" fill="#000" />
          <rect x="0" y="120" width="82" height="8" fill="#000" />
        </mask>
      </defs>
      <g transform="translate(17.6 0) skewX(-10)" mask="url(#masque-symbole-club)">
        <path d="M150.6 57.6 A66 66 0 1 0 150.6 142.4" fill="none" stroke="#DEFD62" strokeWidth={36} />
      </g>
    </svg>
  );
}
