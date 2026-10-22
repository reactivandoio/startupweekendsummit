import { getCurrentUser } from "@/lib/auth";
import { formatCpf, formatPhone } from "@/lib/cpf";
import { ticketNumber } from "@/lib/mail";
import { isConfirmed, matchesFilters, parseSituation, parseSource, situation } from "@/lib/registration-state";
import { listRegistrations } from "@/lib/registrations";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
const reais = (cents: number) => (cents / 100).toFixed(2).replace(".", ",");

// Mesmos filtros da lista (?situacao=…&origem=…): o botão do painel baixa o que está na tela
export async function GET(request: Request) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const params = new URL(request.url).searchParams;
  const filters = { situation: parseSituation(params.get("situacao")), source: parseSource(params.get("origem")) };
  const rows = (await listRegistrations()).filter((r) => matchesFilters(r, filters));
  const header = ["nome", "email", "whatsapp", "cpf", "nascimento", "situacao", "status", "origem", "aprovacao", "analisada_em", "reembolsado_em", "preco_lote", "desconto", "valor", "pago_em", "convite", "lote", "ingresso", "pagamento", "stripe_payment_intent", "cobranca_opapingou", "consentimento_patrocinadores_em", "iniciada_em"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      formatPhone(r.phone),
      formatCpf(r.cpf),
      r.birthDate,
      situation(r),
      r.status,
      r.source,
      r.approval ?? "",
      r.reviewedAt ?? "",
      r.refundedAt ?? "",
      reais(r.listPriceCents),
      reais(r.discountCents),
      reais(r.amountCents),
      r.paidAt ?? "",
      r.inviteName,
      r.lotName,
      isConfirmed(r) ? ticketNumber(r.id) : "",
      r.provider,
      r.stripePaymentIntent ?? "",
      r.opaChargeId ?? "",
      r.sponsorConsentAt ?? "",
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
