import "server-only";
import { ensureSchema, sql } from "@/lib/db";
import { removedByName } from "@/lib/removal";
import { toRemoval, type Removal, type RemovalRow } from "@/lib/removal-core";

export type Volunteer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  area: string;
  availability: string[];
  experience: "sim" | "nao";
  motivation: string;
  createdAt: string;
} & Removal;

type Row = Omit<Volunteer, "createdAt" | keyof Removal> & RemovalRow & { created_at: Date };

const toVolunteer = (r: Row): Volunteer => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  city: r.city,
  area: r.area,
  availability: r.availability,
  experience: r.experience,
  motivation: r.motivation,
  createdAt: r.created_at.toISOString(),
  ...toRemoval(r),
});

// Removidos ficam fora da lista e do CSV
export async function listVolunteers(): Promise<Volunteer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select * from volunteers where removed_at is null order by created_at desc`;
  return rows.map(toVolunteer);
}

// Aba Removidos: mais recente primeiro
export async function listRemovedVolunteers(): Promise<Volunteer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`
    select v.*, ${removedByName("v")} from volunteers v where v.removed_at is not null order by v.removed_at desc`;
  return rows.map(toVolunteer);
}

// E-mail removido que se inscreve de novo volta para a lista com os dados novos (o e-mail é único)
export async function saveVolunteer(
  data: Omit<Volunteer, "id" | "createdAt" | keyof Removal>,
): Promise<{ ok: true; volunteer: Volunteer } | { ok: false; reason: "duplicate" }> {
  await ensureSchema();
  const email = data.email.toLowerCase();
  const rows = await sql<Row[]>`
    insert into volunteers (name, email, phone, city, area, availability, experience, motivation)
    values (${data.name}, ${email}, ${data.phone}, ${data.city}, ${data.area}, ${data.availability}, ${data.experience}, ${data.motivation})
    on conflict (email) do update set
      name = excluded.name, phone = excluded.phone, city = excluded.city, area = excluded.area,
      availability = excluded.availability, experience = excluded.experience, motivation = excluded.motivation,
      created_at = now(), removed_at = null, removed_by = null
    where volunteers.removed_at is not null
    returning *`;
  if (rows.length === 0) return { ok: false, reason: "duplicate" };
  return { ok: true, volunteer: toVolunteer(rows[0]) };
}

// Exclusão lógica: sai da lista e do CSV
export async function removeVolunteer(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`update volunteers set removed_at = now(), removed_by = ${userId} where id = ${id} and removed_at is null returning id`;
  return rows.length > 0;
}

export async function restoreVolunteer(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`update volunteers set removed_at = null, removed_by = null where id = ${id} and removed_at is not null returning id`;
  return rows.length > 0;
}
