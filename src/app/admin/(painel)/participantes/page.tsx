import Link from "next/link";
import {
  approveRegistration,
  reconcileOpaCharges,
  rejectRegistration,
  removeRegistration,
  restoreRegistration,
  toggleDuplicateRefunded,
  toggleRefunded,
} from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { entryFilters, entryLabel, parseEntry, registrationEntry } from "@/lib/coupons-core";
import { formatBRL, formatCpf, formatPhone } from "@/lib/cpf";
import { ticketNumber } from "@/lib/mail";
import {
  canRemove,
  matchesFilters,
  parseCouponFilter,
  parseSituation,
  paymentMethodName,
  removeConfirmMessage,
  reviewReasonLabel,
  situation,
  situationFilters,
  situationLabel,
  type Filters,
  type Situation,
} from "@/lib/registration-state";
import { listRegistrations, type Registration } from "@/lib/registrations";
import { buttonClass } from "@/components/button";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const fmtDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

// Filtros na URL (?situacao=…&origem=…&cupom=…), pra o link da lista filtrada poder ser compartilhado
const filterHref = (f: Filters) => {
  const q = new URLSearchParams();
  if (f.situation) q.set("situacao", f.situation);
  if (f.entry) q.set("origem", f.entry);
  if (f.coupon) q.set("cupom", f.coupon);
  const s = q.toString();
  return s ? `/admin/participantes?${s}` : "/admin/participantes";
};

export default async function ParticipantesPage({ searchParams }: PageProps<"/admin/participantes">) {
  const { situacao, origem, cupom } = await searchParams;
  const filters: Filters = { situation: parseSituation(situacao), entry: parseEntry(origem), coupon: parseCouponFilter(cupom) };
  const all = await listRegistrations();
  // Removidas (lógicas) ficam fora das contagens e só aparecem no filtro "Removidas"
  const active = all.filter((r) => !r.removedAt);
  const removedCount = all.length - active.length;
  const couponCodes = [...new Set(all.map((r) => r.couponCode).filter((c): c is string => Boolean(c)))].sort();
  if (filters.coupon && filters.coupon !== "-" && !couponCodes.includes(filters.coupon)) couponCodes.push(filters.coupon);
  const shown = all.filter((r) => matchesFilters(r, filters));

  const count = (s: Situation) => active.filter((r) => situation(r) === s).length;
  const confirmed = count("confirmed");
  const awaitingApproval = count("awaiting_approval");
  const pending = active.filter((r) => r.status === "pending");
  // Recebido: tudo que foi pago, menos o que já foi reembolsado
  const total = active.filter((r) => r.status === "paid" && !r.refundedAt).reduce((sum, r) => sum + r.amountCents, 0);
  const pendingPix = pending.filter((r) => r.opaChargeId).length;
  const csvHref = filterHref(filters).replace("/admin/participantes", "/admin/participantes.csv");
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Eyebrow>Participantes</Eyebrow>
          <h1 className="font-display text-heading">
            {confirmed} {confirmed === 1 ? "inscrição confirmada" : "inscrições confirmadas"}
          </h1>
          <p className="text-body-md">
            {formatBRL(total)} recebidos · {awaitingApproval} aguardando aprovação · {pending.length} {pending.length === 1 ? "pagamento pendente" : "pagamentos pendentes"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {pendingPix > 0 && (
            <form action={reconcileOpaCharges}>
              <button
                type="submit"
                title="Consulta no Opa Pingou as cobranças Pix pendentes, caso algum webhook não tenha chegado"
                className={buttonClass("secondary", "md")}
              >
                Conferir {pendingPix} {pendingPix === 1 ? "Pix pendente" : "Pix pendentes"}
              </button>
            </form>
          )}
          <a href={csvHref} className={buttonClass("secondary", "md")}>
            Baixar CSV
          </a>
        </div>
      </div>

      <nav aria-label="Filtros" className="flex flex-col gap-4">
        <FilterRow
          label="Situação"
          options={[
            { label: "Todas", href: filterHref({ ...filters, situation: null }), active: !filters.situation },
            ...situationFilters.map((s) => ({
              label: `${situationLabel[s]} (${all.filter((r) => matchesFilters(r, { ...filters, situation: s })).length})`,
              href: filterHref({ ...filters, situation: s }),
              active: filters.situation === s,
            })),
            ...(removedCount > 0 || filters.situation === "removed"
              ? [
                  {
                    label: `Removidas (${all.filter((r) => matchesFilters(r, { ...filters, situation: "removed" })).length})`,
                    href: filterHref({ ...filters, situation: "removed" }),
                    active: filters.situation === "removed",
                  },
                ]
              : []),
          ]}
        />
        <FilterRow
          label="Origem"
          options={[
            { label: "Todas", href: filterHref({ ...filters, entry: null }), active: !filters.entry },
            ...entryFilters.map((s) => ({ label: entryLabel[s], href: filterHref({ ...filters, entry: s }), active: filters.entry === s })),
          ]}
        />
        {(couponCodes.length > 0 || filters.coupon) && (
          <FilterRow
            label="Cupom"
            options={[
              { label: "Todos", href: filterHref({ ...filters, coupon: null }), active: !filters.coupon },
              { label: "Sem cupom", href: filterHref({ ...filters, coupon: "-" }), active: filters.coupon === "-" },
              ...couponCodes.map((c) => ({ label: c, href: filterHref({ ...filters, coupon: c }), active: filters.coupon === c })),
            ]}
          />
        )}
      </nav>

      {shown.length === 0 ? (
        <p className="border-t border-ink pt-6 text-body-md">
          {all.length === 0 ? "Nenhuma inscrição ainda." : filters.situation === "removed" ? "Nenhuma inscrição removida com esses filtros." : "Nenhuma inscrição com esses filtros."}
        </p>
      ) : (
        <ul className="border-t border-ink">
          {shown.map((r) => (
            <RegistrationRow key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterRow({ label, options }: { label: string; options: { label: string; href: string; active: boolean }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-caption font-semibold uppercase tracking-[0.03em]">{label}</span>
      {options.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.active ? "page" : undefined}
          className={`${buttonClass("secondary", "sm")} ${o.active ? "bg-ink! text-paper!" : ""}`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

function RegistrationRow({ r }: { r: Registration }) {
  const s = situation(r);
  return (
    <li className="grid gap-4 border-b border-ash py-6 md:grid-cols-[1.2fr_1fr_1fr_auto]">
      <div className="flex flex-col gap-1">
        <p className="text-body-md font-semibold">{r.name}</p>
        <a href={`mailto:${r.email}`} className="text-body underline underline-offset-4">
          {r.email}
        </a>
        <a href={`https://wa.me/55${r.phone}`} target="_blank" rel="noreferrer" className="text-body underline underline-offset-4">
          {formatPhone(r.phone)}
        </a>
      </div>
      <div className="flex flex-col gap-1 text-body">
        <p>CPF {formatCpf(r.cpf)}</p>
        <p>Nascimento {fmtDate.format(new Date(`${r.birthDate}T00:00:00Z`))}</p>
        <p className="text-caption">
          Origem: {entryLabel[registrationEntry(r)]}
          {r.source === "invite" && ` · ${r.inviteName || r.inviteCode || "sem nome"}`}
        </p>
        {r.couponCode && <p className="font-mono text-caption">Cupom: {r.couponCode}</p>}
        {r.lotName && <p className="text-caption">Lote: {r.lotName}</p>}
        <p className="text-caption" title="Consentimento para compartilhar nome, e-mail e WhatsApp com patrocinadores">
          {r.sponsorConsentAt ? `Patrocinadores: autorizou em ${fmt.format(new Date(r.sponsorConsentAt))}` : "Patrocinadores: não autorizou"}
        </p>
      </div>
      <div className="flex flex-col gap-1 text-body">
        <p className="font-semibold">
          {situationLabel[s]}
          {s === "unpaid" && ` · ${r.status === "expired" ? "expirou" : "pagamento falhou"}`}
        </p>
        {s === "confirmed" && <p className="font-mono text-caption">Ingresso nº {ticketNumber(r.id)}</p>}
        <p className="text-caption">
          {r.status === "paid" && r.paidAt
            ? `${r.provider === "courtesy" ? paymentMethodName(r) : `${formatBRL(r.amountCents)} · ${paymentMethodName(r)}`} em ${fmt.format(new Date(r.paidAt))}`
            : `iniciada em ${fmt.format(new Date(r.createdAt))}${r.provider === "opapingou" ? ` · ${paymentMethodName(r)}` : ""}`}
        </p>
        {r.reviewReason && s === "awaiting_approval" && (
          <p className="border-2 border-ink bg-marigold-wash p-2 text-caption font-semibold text-ink">
            {reviewReasonLabel[r.reviewReason]}. Aprove se houver vaga; se não, reprove e estorne no Opa Pingou.
          </p>
        )}
        {r.removedAt && (
          <p className="border-2 border-ink bg-ash p-2 text-caption font-semibold text-ink">
            Removida em {fmt.format(new Date(r.removedAt))}
            {r.removedByName && ` por ${r.removedByName}`}
          </p>
        )}
        {r.reviewedAt && (
          <p className="text-caption">
            {r.approval === "approved" ? "Aprovada" : "Reprovada"} em {fmt.format(new Date(r.reviewedAt))}
          </p>
        )}
        <p className="text-caption">
          {r.discountCents > 0
            ? `Lista ${formatBRL(r.listPriceCents)} − desconto ${r.discountSource === "coupon" ? `do cupom ${r.couponCode ?? ""}` : "do convite"} ${formatBRL(r.discountCents)} = ${formatBRL(r.amountCents)}`
            : `Lista ${formatBRL(r.listPriceCents)} · sem desconto`}
        </p>
        {r.stripePaymentIntent && (
          <a
            href={`https://dashboard.stripe.com/payments/${r.stripePaymentIntent}`}
            target="_blank"
            rel="noreferrer"
            className="text-caption underline underline-offset-4"
          >
            Ver no Stripe ↗
          </a>
        )}
        {r.opaChargeId && s !== "rejected" && (
          <p className="break-all text-caption" title="Id da cobrança no Opa Pingou">
            {r.opaPaymentLink ? "Link de pagamento" : "Pix"} Opa Pingou · {r.opaChargeId}
          </p>
        )}
        {s === "rejected" && r.status === "paid" && r.amountCents > 0 && <RefundBox r={r} />}
        {r.duplicateCharges.map((c) => (
          <DuplicateBox key={c.id} charge={c} />
        ))}
      </div>
      <div className="flex flex-col gap-2 md:items-end">
        {s === "awaiting_approval" && (
          <>
            <form action={approveRegistration}>
              <input type="hidden" name="id" value={r.id} />
              <ConfirmSubmit
                message={`Aprovar ${r.name} e enviar o ingresso por e-mail?${r.amountCents === 0 ? " A inscrição é gratuita." : ""}`}
                className={buttonClass("primary", "sm")}
              >
                Aprovar
              </ConfirmSubmit>
            </form>
            <form action={rejectRegistration} className="flex flex-col gap-2 md:items-end">
              <input type="hidden" name="id" value={r.id} />
              <ConfirmSubmit
                message={
                  r.amountCents > 0
                    ? `Reprovar ${r.name}? O reembolso de ${formatBRL(r.amountCents)} é feito à mão no meio de pagamento (fica marcado aqui como pendente).`
                    : `Reprovar ${r.name}? A inscrição é gratuita: não há reembolso.`
                }
                className={buttonClass("secondary", "sm")}
              >
                Reprovar
              </ConfirmSubmit>
              <label className="flex items-center gap-2 text-caption">
                <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-ink" />
                Avisar por e-mail
              </label>
            </form>
          </>
        )}
        {canRemove(r) && (
          <form action={removeRegistration}>
            <input type="hidden" name="id" value={r.id} />
            <ConfirmSubmit message={removeConfirmMessage(r, formatBRL)} className={buttonClass("secondary", "sm")}>
              Remover
            </ConfirmSubmit>
          </form>
        )}
        {r.removedAt && (
          <form action={restoreRegistration}>
            <input type="hidden" name="id" value={r.id} />
            <ConfirmSubmit
              message={`Restaurar a inscrição de ${r.name}? Ela volta para a lista ${s === "rejected" ? "como reprovada" : `como "${situationLabel[s]}"`}.`}
              className={buttonClass("secondary", "sm")}
            >
              Restaurar
            </ConfirmSubmit>
          </form>
        )}
      </div>
    </li>
  );
}

// Pagamento em dobro: a pessoa pagou a mesma inscrição por duas cobranças (ex.: Pix e depois o link do cartão).
// A inscrição vale; a segunda cobrança é estornada à mão no painel do Opa Pingou e marcada aqui.
function DuplicateBox({ charge }: { charge: Registration["duplicateCharges"][number] }) {
  return (
    <div className={`mt-2 flex flex-col gap-2 border-2 border-ink p-3 text-caption text-ink ${charge.refundedAt ? "bg-grass-wash" : "bg-marigold-wash"}`}>
      <p className="font-semibold">
        {charge.refundedAt ? `Pagamento em dobro estornado em ${fmt.format(new Date(charge.refundedAt))}` : "Pagamento em dobro: estornar"}
      </p>
      <p className="break-all">
        {charge.kind === "PAYMENT_LINK" ? "Link de pagamento" : "Pix"} Opa Pingou · cobrança {charge.id} · paga em {fmt.format(new Date(charge.at))}
      </p>
      <form action={toggleDuplicateRefunded}>
        <input type="hidden" name="chargeId" value={charge.id} />
        <input type="hidden" name="refunded" value={charge.refundedAt ? "0" : "1"} />
        <button type="submit" className={buttonClass("secondary", "sm")}>
          {charge.refundedAt ? "Desmarcar estorno" : "Marcar como estornada"}
        </button>
      </form>
    </div>
  );
}

// Reprovada paga: o que é preciso para achar a cobrança no painel do meio de pagamento e marcar o reembolso
function RefundBox({ r }: { r: Registration }) {
  const charge = r.opaChargeId ? `Opa Pingou · cobrança ${r.opaChargeId}` : r.stripePaymentIntent ? `Stripe · ${r.stripePaymentIntent}` : "sem cobrança registrada";
  return (
    <div className={`mt-2 flex flex-col gap-2 border-2 border-ink p-3 text-caption text-ink ${r.refundedAt ? "bg-grass-wash" : "bg-marigold-wash"}`}>
      <p className="font-semibold">{r.refundedAt ? `Reembolsada em ${fmt.format(new Date(r.refundedAt))}` : "Reembolso pendente"}</p>
      <p className="break-all">{charge}</p>
      <p>
        {formatBRL(r.amountCents)}
        {r.paidAt && ` · paga em ${fmt.format(new Date(r.paidAt))}`}
      </p>
      <form action={toggleRefunded}>
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="refunded" value={r.refundedAt ? "0" : "1"} />
        <button type="submit" className={buttonClass("secondary", "sm")}>
          {r.refundedAt ? "Desmarcar reembolso" : "Marcar como reembolsada"}
        </button>
      </form>
    </div>
  );
}
