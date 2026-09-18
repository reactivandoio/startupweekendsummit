import { removeRegistration } from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { formatBRL, formatCpf, formatPhone } from "@/lib/cpf";
import { listRegistrations, type RegistrationStatus } from "@/lib/registrations";

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
        <a href="/admin/participantes.csv" className="border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink">
          Baixar CSV
        </a>
      </div>

      {all.length === 0 ? (
        <p className="border-t border-ink pt-6 text-body-md dark:border-paper">Nenhuma inscrição ainda.</p>
      ) : (
        <ul className="border-t border-ink dark:border-paper">
          {all.map((r) => (
            <li key={r.id} className="grid gap-4 border-b border-ash py-6 dark:border-graphite md:grid-cols-[1.2fr_1fr_1fr_auto]">
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
              </div>
              <div className="flex flex-col gap-1 text-body">
                <p className="font-semibold">{statusLabel[r.status]}</p>
                <p className="text-caption">
                  {r.status === "paid" && r.paidAt ? `${formatBRL(r.amountCents)} em ${fmt.format(new Date(r.paidAt))}` : `iniciada em ${fmt.format(new Date(r.createdAt))}`}
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
              </div>
              {r.status !== "paid" && (
                <form action={removeRegistration} className="md:justify-self-end">
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="border border-ash px-3 py-2 text-caption transition-colors hover:border-ink dark:border-graphite dark:hover:border-paper">
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
