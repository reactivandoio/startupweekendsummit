import { reconcileOpaCharges, removeRegistration } from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { formatBRL, formatCpf, formatPhone } from "@/lib/cpf";
import { ticketNumber } from "@/lib/mail";
import { listRegistrations, type RegistrationStatus } from "@/lib/registrations";
import { buttonClass } from "@/components/button";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const fmtDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" });

const statusLabel: Record<RegistrationStatus, string> = {
  paid: "Pago",
  pending: "Aguardando pagamento",
  expired: "Expirado",
  canceled: "Pagamento falhou",
};

export default async function ParticipantesPage() {
  const all = await listRegistrations();
  const paid = all.filter((r) => r.status === "paid");
  const pending = all.filter((r) => r.status === "pending");
  const total = paid.reduce((sum, r) => sum + r.amountCents, 0);
  const pendingPix = pending.filter((r) => r.opaChargeId).length;
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Eyebrow>Participantes</Eyebrow>
          <h1 className="font-display text-heading">
            {paid.length} {paid.length === 1 ? "inscrição paga" : "inscrições pagas"}
          </h1>
          <p className="text-body-md">
            {formatBRL(total)} recebidos · {pending.length} {pending.length === 1 ? "pendente" : "pendentes"}
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
          <a href="/admin/participantes.csv" className={buttonClass("secondary", "md")}>
            Baixar CSV
          </a>
        </div>
      </div>

      {all.length === 0 ? (
        <p className="border-t border-ink pt-6 text-body-md">Nenhuma inscrição ainda.</p>
      ) : (
        <ul className="border-t border-ink">
          {all.map((r) => (
            <li key={r.id} className="grid gap-4 border-b border-ash py-6 md:grid-cols-[1.2fr_1fr_1fr_auto]">
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
                <p className="text-caption">Convite: {r.inviteName || "aberto"}</p>
                {r.lotName && <p className="text-caption">Lote: {r.lotName}</p>}
              </div>
              <div className="flex flex-col gap-1 text-body">
                <p className="font-semibold">{statusLabel[r.status]}</p>
                {r.status === "paid" && <p className="font-mono text-caption">Ingresso nº {ticketNumber(r.id)}</p>}
                <p className="text-caption">
                  {r.status === "paid" && r.paidAt
                    ? `${r.provider === "courtesy" ? "Cortesia" : formatBRL(r.amountCents)} em ${fmt.format(new Date(r.paidAt))}`
                    : `iniciada em ${fmt.format(new Date(r.createdAt))}`}
                </p>
                {r.discountCents > 0 && (
                  <p className="text-caption">
                    Lote {formatBRL(r.listPriceCents)} − desconto {formatBRL(r.discountCents)} = {formatBRL(r.amountCents)}
                  </p>
                )}
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
                {r.opaChargeId && (
                  <p className="break-all text-caption" title="Id da cobrança no Opa Pingou">
                    Pix Opa Pingou · {r.opaChargeId}
                  </p>
                )}
              </div>
              {r.status !== "paid" && (
                <form action={removeRegistration} className="md:justify-self-end">
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className={buttonClass("secondary", "sm")}>
                    Remover
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
