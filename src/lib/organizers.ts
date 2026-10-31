import "server-only";
import { cache } from "react";
import { ensureSchema, sql } from "@/lib/db";
import { sanitizeSocials, type Social } from "@/lib/organizers-core";
import { parseCrop, type Crop } from "@/lib/photo-crop-core";
import { removedByName } from "@/lib/removal";
import { toRemoval, type Removal, type RemovalRow } from "@/lib/removal-core";

export type Organizer = {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string; // recorte quadrado exibido no site, arquivo no volume de uploads; vazio = sem foto
  photoSource: string; // original guardado pra recortar de novo; vazio nas fotos de antes do editor (recorta a partir de photo)
  photoCrop: Crop | null; // estado do editor de recorte; null = recorte padrão (centro, sem zoom)
  photoAlt: string; // vazio = usa o nome (ver organizerAlt)
  socials: Social[];
  active: boolean;
  position: number;
} & Removal;

export type OrganizerInput = Omit<Organizer, "id" | "position" | keyof Removal>;

type Row = RemovalRow & {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  photo_source: string;
  photo_crop: unknown;
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
  photoSource: r.photo_source,
  photoCrop: parseCrop(r.photo_crop),
  photoAlt: r.photo_alt,
  socials: sanitizeSocials(r.socials),
  active: r.active,
  position: r.position,
  ...toRemoval(r),
});

// jsonb aceita null direto; o objeto vai serializado
const cropJson = (crop: Crop | null) => (crop ? sql.json(crop) : null);

// Sem alt informado no painel, "Foto de <nome>" descreve a imagem
export const organizerAlt = (o: Organizer) => o.photoAlt || `Foto de ${o.name}`;

// Removidos ficam fora (aba Removidos: listRemovedOrganizers)
export async function listOrganizers(): Promise<Organizer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select * from organizers where removed_at is null order by position, created_at`;
  return rows.map(toOrganizer);
}

// Mais recente primeiro
export async function listRemovedOrganizers(): Promise<Organizer[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`
    select o.*, ${removedByName("o")} from organizers o where o.removed_at is not null order by o.removed_at desc`;
  return rows.map(toOrganizer);
}

// Seção do site: só os ativos, na ordem do painel; uma query por requisição
export const listActiveOrganizersCached = cache(async () => (await listOrganizers()).filter((o) => o.active));

// Removido não abre pra edição
export async function getOrganizer(id: string): Promise<Organizer | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`select * from organizers where id = ${id} and removed_at is null`;
  return row ? toOrganizer(row) : null;
}

// Entra no fim da lista
export async function createOrganizer(data: OrganizerInput): Promise<Organizer> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    insert into organizers (name, role, bio, photo, photo_source, photo_crop, photo_alt, socials, active, position)
    values (${data.name}, ${data.role}, ${data.bio}, ${data.photo}, ${data.photoSource}, ${cropJson(data.photoCrop)}, ${data.photoAlt},
      ${sql.json(data.socials)}, ${data.active},
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
      photo_source = ${data.photoSource},
      photo_crop = ${cropJson(data.photoCrop)},
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

// Exclusão lógica: some do painel e do site; a foto fica no volume pra restaurar
export async function removeOrganizer(id: string, userId: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update organizers set removed_at = now(), removed_by = ${userId}, updated_at = now()
    where id = ${id} and removed_at is null returning id`;
  return rows.length > 0;
}

// Volta no fim da lista, ativo ou inativo como estava
export async function restoreOrganizer(id: string): Promise<boolean> {
  await ensureSchema();
  const rows = await sql`
    update organizers set removed_at = null, removed_by = null, updated_at = now(),
      position = (select coalesce(max(position), -1) + 1 from organizers where removed_at is null)
    where id = ${id} and removed_at is not null returning id`;
  return rows.length > 0;
}

// Sobe/desce uma posição. Renumera a lista inteira (0..n-1) na mesma transação, como nos patrocinadores.
export async function moveOrganizer(id: string, direction: "up" | "down") {
  await ensureSchema();
  await sql.begin(async (tx) => {
    const all = await tx<Row[]>`select * from organizers where removed_at is null order by position, created_at for update`;
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
