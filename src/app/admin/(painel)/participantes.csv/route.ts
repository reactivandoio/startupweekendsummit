import { getCurrentUser } from "@/lib/auth";
import { formatCpf, formatPhone } from "@/lib/cpf";
import { ticketNumber } from "@/lib/mail";
import { listRegistrations } from "@/lib/registrations";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

export async function GET() {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const rows = await listRegistrations();
  const header = ["nome", "email", "whatsapp", "cpf", "nascimento", "status", "preco_lote", "desconto", "valor", "pago_em", "convite", "lote", "ingresso", "pagamento", "stripe_payment_intent", "cobranca_opapingou", "iniciada_em"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      formatPhone(r.phone),
      formatCpf(r.cpf),
      r.birthDate,
      r.status,
      reais(r.listPriceCents),
      reais(r.discountCents),
      reais(r.amountCents),
      r.paidAt ?? "",
      r.inviteName,
      r.lotName,
      r.status === "paid" ? ticketNumber(r.id) : "",
      r.provider,
      r.stripePaymentIntent ?? "",
      r.opaChargeId ?? "",
      r.createdAt,
    ]
      .map(esc)
      .join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participantes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
