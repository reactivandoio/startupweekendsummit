import Link from "next/link";
import { removeCouponAction, restoreCouponAction, toggleCouponAction } from "@/app/admin/actions";
import { Button, buttonClass } from "@/components/button";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { CopyButton } from "@/components/copy-button";
import { CouponForm } from "@/components/coupon-form";
import { Eyebrow } from "@/components/eyebrow";
import { RemovedList, RemovedToggle } from "@/components/removed-list";
import { listCoupons, listRemovedCoupons, type Coupon } from "@/lib/coupons";
import { couponProblem } from "@/lib/coupons-core";
import { formatBRL } from "@/lib/cpf";
import { describeDiscount, discountInputValue } from "@/lib/discounts";
import { brasiliaInputValue, describePeriod } from "@/lib/lots-core";
import { showingRemoved } from "@/lib/removal-core";
import { appUrl } from "@/lib/stripe";
import { listLots } from "@/lib/tickets";

// Situação do cupom agora (sem olhar o lote: "fora do lote" depende de qual está à venda)
function statusOf(c: Coupon): string {
  const p = couponProblem({ ...c, lotIds: [] }, null);
  return p === "inactive" ? "Inativo" : p === "not_started" ? "Agendado" : p === "expired" ? "Expirado" : p === "exhausted" ? "Esgotado" : "Ativo";
}

const discountLabel = (c: Coupon) =>
  c.discount.kind === "none" ? "Sem desconto (rastreamento)" : c.discount.kind === "courtesy" ? "100%: gratuita" : describeDiscount(c.discount);

export default async function CuponsPage({ searchParams }: PageProps<"/admin/cupons">) {
  const showing = showingRemoved((await searchParams).removidos);
  const [coupons, removed, lots] = await Promise.all([listCoupons(), listRemovedCoupons(), listLots()]);
  const lotName = new Map(lots.map((l) => [l.id, l.name]));
  const lotOptions = lots.map((l) => ({ id: l.id, name: l.name }));
  const active = coupons.filter((c) => statusOf(c) === "Ativo").length;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Cupons</Eyebrow>
        <h1 className="font-display text-heading">
          {active} {active === 1 ? "cupom ativo" : "cupons ativos"}
        </h1>
        <p className="max-w-[40ch] text-body-md">
          Um cupom por track ou canal de divulgação: com desconto ou sem (0%, só para saber de onde veio cada inscrição). Vale no campo Cupom do
          checkout (inscrição aberta e convite) e no link de cada cupom, que já abre com ele aplicado. Não soma com o desconto do convite: vale o maior.
          Os usos contam pagamentos abertos (por 1 hora) e inscrições pagas; reprovada devolve o uso.
        </p>
        <RemovedToggle path="/admin/cupons" count={removed.length} showing={showing} />
        <CouponForm lots={lotOptions} />
      </div>

      {showing ? (
        <RemovedList
          className="self-start"
          empty="Nenhum cupom removido."
          restore={restoreCouponAction}
          items={removed.map((c) => ({
            ...c,
            title: c.code,
            detail: [c.description, discountLabel(c)].filter(Boolean).join(" · "),
            restoreMessage: `Restaurar o cupom ${c.code}? O código e o link voltam a valer${c.active ? "" : " quando for ativado"}.`,
          }))}
        />
      ) : coupons.length === 0 ? (
        <p className="self-start border-t border-ink pt-6 text-body-md">Nenhum cupom ainda.</p>
      ) : (
        <ul className="self-start border-t border-ink">
          {coupons.map((c) => {
            const url = `${appUrl()}/inscricao/aberta?cupom=${encodeURIComponent(c.code)}`;
            const period = describePeriod(c.startsAt, c.endsAt);
            const uses = c.uses;
            return (
              <li key={c.id} className="flex flex-col gap-4 border-b border-ash py-6">
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto]">
                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="font-mono text-body-md font-semibold">{c.code}</p>
                    {c.description && <p className="text-body">{c.description}</p>}
                    <code className="mt-1 break-all font-mono text-caption">{url}</code>
                  </div>
                  <div className="flex flex-col gap-1 text-body">
                    <p className="font-semibold">{statusOf(c)}</p>
                    {c.discount.kind === "none" ? (
                      <p className="text-caption">{discountLabel(c)}</p>
                    ) : (
                      <p className="self-start border-2 border-grass bg-grass-wash px-2 py-0.5 text-caption font-semibold text-grass-deep">{discountLabel(c)}</p>
                    )}
                    <p className="text-caption">
                      {uses} {uses === 1 ? "uso" : "usos"}
                      {c.maxUses !== null && ` de ${c.maxUses}`} ·{" "}
                      <Link href={`/admin/participantes?cupom=${encodeURIComponent(c.code)}`} className="underline underline-offset-4">
                        {c.paid} {c.paid === 1 ? "paga" : "pagas"}
                      </Link>{" "}
                      · {formatBRL(c.soldCents)} vendidos
                    </p>
                    <p className="text-caption">{c.lotIds.length === 0 ? "Todos os lotes" : `Lotes: ${c.lotIds.map((id) => lotName.get(id) ?? "removido").join(", ")}`}</p>
                    {period && <p className="text-caption">Válido {period}</p>}
                  </div>
                  <div className="flex flex-wrap items-start gap-2 self-start md:justify-self-end">
                    <CopyButton text={url} label="Copiar link" />
                    <form action={toggleCouponAction} className="flex">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                      <Button type="submit" size="sm">
                        {c.active ? "Desativar" : "Ativar"}
                      </Button>
                    </form>
                    {uses === 0 && c.paid === 0 && (
                      <form action={removeCouponAction} className="flex">
                        <input type="hidden" name="id" value={c.id} />
                        <ConfirmSubmit
                          message={`Remover o cupom ${c.code}? O código e o link param de valer; dá para restaurar em Removidos.`}
                          className={buttonClass("secondary", "sm")}
                        >
                          Remover
                        </ConfirmSubmit>
                      </form>
                    )}
                  </div>
                </div>
                <details>
                  <summary className="cursor-pointer text-caption font-semibold underline underline-offset-4">Editar</summary>
                  <div className="pt-4">
                    <CouponForm
                      lots={lotOptions}
                      coupon={{
                        id: c.id,
                        code: c.code,
                        description: c.description,
                        discountKind: c.discount.kind === "courtesy" ? "percent" : c.discount.kind,
                        discountValue: c.discount.kind === "courtesy" ? "100" : discountInputValue(c.discount),
                        lotIds: c.lotIds,
                        maxUses: c.maxUses === null ? "" : String(c.maxUses),
                        startsAt: brasiliaInputValue(c.startsAt),
                        endsAt: brasiliaInputValue(c.endsAt),
                        active: c.active,
                      }}
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
