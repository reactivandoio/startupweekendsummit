/* Mural geométrico full-bleed: formas chapadas, sem gradiente, sem sombra, sem radius.
   É divisor decorativo entre o hero e o conteúdo — não carrega informação.
   Duas composições: uma larga (md+) e uma recomposta pra tela estreita, pra não cortar formas. */
export function Mural() {
  return (
    <div className="w-full overflow-hidden bg-paper" aria-hidden="true">
      {/* Desktop */}
      <svg viewBox="0 0 1440 250" preserveAspectRatio="xMidYMid slice" className="hidden h-[250px] w-full md:block">
        <rect x="0" y="0" width="1440" height="250" fill="var(--color-paper)" />
        <circle cx="120" cy="230" r="150" fill="var(--color-indigo)" />
        <rect x="380" y="0" width="140" height="120" fill="var(--color-lavender)" />
        <rect x="760" y="60" width="130" height="130" fill="var(--color-mint-wash)" />
        <polygon points="825,85 860,105 860,145 825,165 790,145 790,105" fill="var(--color-maroon)" />
        <polygon points="560,250 640,130 720,250 680,250 640,190 600,250" fill="var(--color-yellow)" />
        <circle cx="1310" cy="60" r="60" fill="var(--color-orange)" />
        <rect x="1080" y="110" width="200" height="140" fill="var(--color-emerald-band)" />
        <circle cx="1000" cy="40" r="10" fill="var(--color-ink)" />
        <circle cx="1030" cy="40" r="10" fill="var(--color-ink)" />
        <circle cx="1060" cy="40" r="10" fill="var(--color-ink)" />
        <path d="M280 250 a70 70 0 0 1 140 0 Z" fill="var(--color-mint-wash)" />
      </svg>

      {/* Mobile: mesmas formas, reorganizadas em 390x220 */}
      <svg viewBox="0 0 390 220" preserveAspectRatio="xMidYMid slice" className="block h-[220px] w-full md:hidden">
        <rect x="0" y="0" width="390" height="220" fill="var(--color-paper)" />
        {/* círculo índigo, inferior esquerdo */}
        <circle cx="40" cy="200" r="90" fill="var(--color-indigo)" />
        {/* retângulo lavanda, topo esquerdo */}
        <rect x="0" y="0" width="70" height="70" fill="var(--color-lavender)" />
        {/* chevron amarelo, centro-baixo */}
        <polygon points="130,220 185,140 240,220 212,220 185,180 158,220" fill="var(--color-yellow)" />
        {/* quadrado mint + hexágono maroon, centro-topo */}
        <rect x="150" y="10" width="90" height="90" fill="var(--color-mint-wash)" />
        <polygon points="195,25 220,40 220,70 195,85 170,70 170,40" fill="var(--color-maroon)" />
        {/* pontos */}
        <circle cx="275" cy="30" r="7" fill="var(--color-ink)" />
        <circle cx="297" cy="30" r="7" fill="var(--color-ink)" />
        <circle cx="319" cy="30" r="7" fill="var(--color-ink)" />
        {/* círculo laranja, direita */}
        <circle cx="360" cy="90" r="40" fill="var(--color-orange)" />
        {/* retângulo esmeralda, inferior direito */}
        <rect x="260" y="130" width="130" height="90" fill="var(--color-emerald-band)" />
        {/* meio círculo mint na base */}
        <path d="M90 220 a45 45 0 0 1 90 0 Z" fill="var(--color-mint-wash)" />
      </svg>
    </div>
  );
}
