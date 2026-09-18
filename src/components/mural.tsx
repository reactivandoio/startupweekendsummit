/* Mural geométrico full-bleed: formas chapadas, sem gradiente, sem sombra, sem radius.
   É divisor decorativo entre o hero e o conteúdo — não carrega informação. */
export function Mural() {
  return (
    <div className="w-full overflow-hidden bg-paper" aria-hidden="true">
      <svg viewBox="0 0 1440 250" preserveAspectRatio="xMidYMid slice" className="block h-[200px] w-full md:h-[250px]">
        <rect x="0" y="0" width="1440" height="250" fill="var(--color-paper)" />
        {/* círculo índigo, canto inferior esquerdo */}
        <circle cx="120" cy="230" r="150" fill="var(--color-indigo)" />
        {/* retângulo lavanda, topo centro */}
        <rect x="380" y="0" width="140" height="120" fill="var(--color-lavender)" />
        {/* quadrado mint + hexágono maroon, centro-direita */}
        <rect x="760" y="60" width="130" height="130" fill="var(--color-mint-wash)" />
        <polygon points="825,85 860,105 860,145 825,165 790,145 790,105" fill="var(--color-maroon)" />
        {/* chevron amarelo */}
        <polygon points="560,250 640,130 720,250 680,250 640,190 600,250" fill="var(--color-yellow)" />
        {/* círculo laranja, extrema direita */}
        <circle cx="1310" cy="60" r="60" fill="var(--color-orange)" />
        {/* retângulo esmeralda, inferior direito */}
        <rect x="1080" y="110" width="200" height="140" fill="var(--color-emerald-band)" />
        {/* pontos */}
        <circle cx="1000" cy="40" r="10" fill="var(--color-ink)" />
        <circle cx="1030" cy="40" r="10" fill="var(--color-ink)" />
        <circle cx="1060" cy="40" r="10" fill="var(--color-ink)" />
        {/* meio círculo mint fechando a esquerda */}
        <path d="M280 250 a70 70 0 0 1 140 0 Z" fill="var(--color-mint-wash)" />
      </svg>
    </div>
  );
}
