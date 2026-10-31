import Link from "next/link";
import { buttonClass } from "@/components/button";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { removalLabel, REMOVED_PARAM, type Removal } from "@/lib/removal-core";

// Aba "Removidos" dos cadastros do painel (STA-26): exclusão é lógica, então tudo que foi removido aparece aqui com
// quem removeu e quando, e volta pelo Restaurar (com confirmação).

// Alterna entre a lista e os removidos; some quando não há removido e a aba não está aberta.
// anchor: id da seção, quando a lista não está no topo da página (ex.: lotes em Ingressos)
export function RemovedToggle({ path, count, showing, anchor }: { path: string; count: number; showing: boolean; anchor?: string }) {
  if (!showing && count === 0) return null;
  const hash = anchor ? `#${anchor}` : "";
  return (
    <Link href={`${showing ? path : `${path}?${REMOVED_PARAM}=1`}${hash}`} className={`self-start ${buttonClass("secondary", "sm")}`}>
      {showing ? "← Voltar à lista" : `Removidos (${count})`}
    </Link>
  );
}

export type RemovedItem = Removal & {
  id: string;
  title: string;
  detail?: string;
  restoreMessage: string; // texto da confirmação do Restaurar
};

export function RemovedList({
  items,
  restore,
  empty = "Nada removido.",
  className = "",
}: {
  items: RemovedItem[];
  restore: (formData: FormData) => Promise<void>;
  empty?: string;
  className?: string;
}) {
  if (items.length === 0) return <p className={`border-t border-ink pt-6 text-body-md ${className}`}>{empty}</p>;
  return (
    <ul className={`border-t border-ink ${className}`}>
      {items.map((item) => (
        <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-ash py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-body-md font-semibold">{item.title}</p>
            {item.detail && <p className="text-caption">{item.detail}</p>}
            <p className="self-start border-2 border-ink bg-ash px-2 py-0.5 text-caption font-semibold text-ink">{removalLabel(item)}</p>
          </div>
          <form action={restore}>
            <input type="hidden" name="id" value={item.id} />
            <ConfirmSubmit message={item.restoreMessage} className={buttonClass("secondary", "sm")}>
              Restaurar
            </ConfirmSubmit>
          </form>
        </li>
      ))}
    </ul>
  );
}
