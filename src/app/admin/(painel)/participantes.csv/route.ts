import { getCurrentUser } from "@/lib/auth";
import { formatCpf, formatPhone } from "@/lib/cpf";
import { listRegistrations } from "@/lib/registrations";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const rows = await listRegistrations();
  const header = ["nome", "email", "whatsapp", "cpf", "nascimento", "status", "valor", "pago_em", "convite", "stripe_payment_intent", "iniciada_em"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.email,
      formatPhone(r.phone),
      formatCpf(r.cpf),
      r.birthDate,
      r.status,
      (r.amountCents / 100).toFixed(2).replace(".", ","),
      r.paidAt ?? "",
      r.inviteName,
      r.stripePaymentIntent ?? "",
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
