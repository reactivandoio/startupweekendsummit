/* Rótulo de seção: caixa-alta com o "_" da Techstars em degradê Grass → Marigold */
export function Eyebrow({
  children,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.03em] ${light ? "text-paper" : "text-ink dark:text-paper"} ${className}`}
    >
      <span aria-hidden="true" className="h-[3px] w-6 shrink-0 bg-linear-to-r from-grass to-marigold" />
      {children}
    </p>
  );
}
