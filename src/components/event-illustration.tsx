/* Ilustração do evento: quadrados chapados com formas brancas por cima.
   É decoração — nunca carrega informação de interface. */
export function EventIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      className={className}
      aria-hidden="true"
      focusable="false"
      shapeRendering="crispEdges"
    >
      <g transform="rotate(-4 120 110)">
        <rect x="20" y="30" width="180" height="180" fill="var(--color-ill-green)" />
        <circle cx="110" cy="120" r="46" fill="#fff" />
      </g>
      <g transform="rotate(3 280 150)">
        <rect x="190" y="60" width="180" height="180" fill="var(--color-ill-cyan)" />
        <path d="M230 200 L280 100 L330 200 Z" fill="#fff" />
      </g>
      <g transform="rotate(-2 130 230)">
        <rect x="70" y="170" width="130" height="130" fill="var(--color-ill-orange)" />
        <rect x="105" y="205" width="60" height="60" fill="#fff" />
      </g>
      <g transform="rotate(5 320 50)">
        <rect x="260" y="0" width="120" height="120" fill="var(--color-ill-yellow)" />
        <path d="M290 30 h60 v60 h-60 Z M320 30 v60" fill="none" stroke="#fff" strokeWidth="10" />
      </g>
    </svg>
  );
}
