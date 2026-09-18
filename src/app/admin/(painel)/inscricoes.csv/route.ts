import { getCurrentUser } from "@/lib/auth";
import { listVolunteers } from "@/lib/volunteers";

const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

export async function GET() {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const rows = await listVolunteers();
  const header = ["nome", "email", "telefone", "cidade", "area", "disponibilidade", "experiencia", "motivacao", "inscrito_em"];
  const lines = rows.map((v) =>
    [v.name, v.email, v.phone, v.city, v.area, v.availability.join("; "), v.experience, v.motivation, v.createdAt].map(esc).join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inscricoes-voluntarios-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
