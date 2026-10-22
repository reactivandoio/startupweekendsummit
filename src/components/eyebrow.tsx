/* Rótulo de seção: caixa-alta com o "_" da Techstars em degradê Grass → Marigold.
   tone: "ink" acompanha o tema; "obsidian" (faixas Grass/Marigold) e "white" (papel preto) são fixos. */
export function Eyebrow({
  children,
  tone = "ink",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "ink" | "obsidian" | "white";
  className?: string;
}) {
  const color = tone === "obsidian" ? "text-obsidian" : tone === "white" ? "text-white" : "text-ink";
  return (
    <p className={`flex items-center gap-3 text-caption font-semibold uppercase tracking-[0.03em] ${color} ${className}`}>
      <span aria-hidden="true" className="h-[3px] w-6 shrink-0 bg-linear-to-r from-grass to-marigold" />
      {children}
    </p>
  );
}
