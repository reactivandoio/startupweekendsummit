import "server-only";
import { cache } from "react";
import { ensureSchema, sql } from "@/lib/db";
import { sanitizeSocials, type Social } from "@/lib/organizers-core";

export type Organizer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string; // arquivo no volume de uploads; vazio = sem foto
  photoAlt: string; // vazio = usa o nome (ver organizerAlt)
  socials: Social[];
  active: boolean;
  position: number;
};

export type OrganizerInput = Omit<Organizer, "id" | "position">;

type Row = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  photo_alt: string;
  socials: unknown;
  active: boolean;
  position: number;
};

const toOrganizer = (r: Row): Organizer => ({
  id: r.id,
  name: r.name,
  role: r.role,
  bio: r.bio,
  photo: r.photo,
  photoAlt: r.photo_alt,
  socials: sanitizeSocials(r.socials),
  active: r.active,
  position: r.position,
});

// Sem alt informado no painel, "Foto de <nome>" descreve a imagem
export const organizerAlt = (o: Organizer) => o.photoAlt || `Foto de ${o.name}`;

export async function listOrganizers(): Promise<Organizer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select * from organizers order by position, created_at`;
  return rows.map(toOrganizer);
}

// Seção do site: só os ativos, na ordem do painel; uma query por requisição
export const listActiveOrganizersCached = cache(async () => (await listOrganizers()).filter((o) => o.active));

export async function getOrganizer(id: string): Promise<Organizer | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`select * from organizers where id = ${id}`;
  return row ? toOrganizer(row) : null;
}

// Entra no fim da lista
export async function createOrganizer(data: OrganizerInput): Promise<Organizer> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    insert into organizers (name, role, bio, photo, photo_alt, socials, active, position)
    values (${data.name}, ${data.role}, ${data.bio}, ${data.photo}, ${data.photoAlt}, ${sql.json(data.socials)}, ${data.active},
      (select coalesce(max(position), -1) + 1 from organizers))
    returning *`;
  return toOrganizer(row);
}

export async function updateOrganizer(id: string, data: OrganizerInput) {
  await ensureSchema();
  await sql`
    update organizers set
      name = ${data.name},
      role = ${data.role},
      bio = ${data.bio},
      photo = ${data.photo},
      photo_alt = ${data.photoAlt},
      socials = ${sql.json(data.socials)},
      active = ${data.active},
      updated_at = now()
    where id = ${id}`;
}

export async function setOrganizerActive(id: string, active: boolean) {
  await ensureSchema();
  await sql`update organizers set active = ${active}, updated_at = now() where id = ${id}`;
}

// Devolve o removido, pra quem chamou apagar o arquivo da foto
export async function deleteOrganizer(id: string): Promise<Organizer | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`delete from organizers where id = ${id} returning *`;
  return row ? toOrganizer(row) : null;
}

// Sobe/desce uma posição. Renumera a lista inteira (0..n-1) na mesma transação, como nos patrocinadores.
export async function moveOrganizer(id: string, direction: "up" | "down") {
  await ensureSchema();
  await sql.begin(async (tx) => {
    const all = await tx<Row[]>`select * from organizers order by position, created_at for update`;
    const ids = all.map((o) => o.id);
    const from = ids.indexOf(id);
    if (from === -1) return;
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    for (const [position, oid] of ids.entries()) {
      await tx`update organizers set position = ${position} where id = ${oid}`;
    }
  });
}
