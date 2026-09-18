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
    <p className={`text-caption font-semibold uppercase tracking-[0.03em] ${light ? "text-paper" : "text-ink"} ${className}`}>
      {children}
    </p>
  );
}
