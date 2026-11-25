/** Symbole du Club : le C incliné aux traînées de vitesse (logo D2). Source : marque/logo-club-symbole.svg. */
export function SymboleClub({ hauteur = 30 }: { hauteur?: number }) {
  const T = "translate(28.7 0) skewX(-16)";
  return (
    <svg
      viewBox="-60 0 260 200"
      width={Math.round(hauteur * 1.3)}
      height={hauteur}
      aria-hidden
      focusable="false"
      style={{ display: "block", flex: "none" }}
    >
      <defs>
        <mask id="masque-symbole-club" maskUnits="userSpaceOnUse" x="-80" y="-20" width="360" height="240">
          <rect x="-80" y="-20" width="360" height="240" fill="#fff" />
          <rect x="0" y="72" width="82" height="8" fill="#000" />
          <rect x="0" y="96" width="82" height="8" fill="#000" />
          <rect x="0" y="120" width="82" height="8" fill="#000" />
        </mask>
      </defs>
      <g transform={T} mask="url(#masque-symbole-club)">
        <path d="M150.6 57.6 A66 66 0 1 0 150.6 142.4" fill="none" stroke="#DEFD62" strokeWidth={36} />
      </g>
      <g transform={T}>
        <rect x="-52" y="72" width="26" height="8" fill="#FA94FF" opacity=".55" />
        <rect x="-26" y="72" width="14" height="8" fill="#FA94FF" opacity=".9" />
        <rect x="-58" y="96" width="46" height="8" fill="#DEFD62" />
        <rect x="-44" y="120" width="22" height="8" fill="#FA94FF" opacity=".55" />
        <rect x="-18" y="120" width="10" height="8" fill="#FA94FF" opacity=".9" />
      </g>
    </svg>
  );
}
