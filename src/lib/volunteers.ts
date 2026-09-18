import "server-only";
import { ensureSchema, sql } from "@/lib/db";

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
};

type Row = Omit<Volunteer, "createdAt"> & { created_at: Date };

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
});

export async function listVolunteers(): Promise<Volunteer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select * from volunteers order by created_at desc`;
  return rows.map(toVolunteer);
}

export async function saveVolunteer(
  data: Omit<Volunteer, "id" | "createdAt">,
): Promise<{ ok: true; volunteer: Volunteer } | { ok: false; reason: "duplicate" }> {
  await ensureSchema();
  const email = data.email.toLowerCase();
  const rows = await sql<Row[]>`
    insert into volunteers (name, email, phone, city, area, availability, experience, motivation)
    values (${data.name}, ${email}, ${data.phone}, ${data.city}, ${data.area}, ${data.availability}, ${data.experience}, ${data.motivation})
    on conflict (email) do nothing
    returning *`;
  if (rows.length === 0) return { ok: false, reason: "duplicate" };
  return { ok: true, volunteer: toVolunteer(rows[0]) };
}

export async function deleteVolunteer(id: string) {
  await ensureSchema();
  await sql`delete from volunteers where id = ${id}`;
}
