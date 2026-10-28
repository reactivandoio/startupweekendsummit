import "server-only";
import { cache } from "react";
import { sponsorCategories } from "@/content/site";
import { ensureSchema, sql } from "@/lib/db";

export type SponsorTier = (typeof sponsorCategories)[number]["id"];

export type Sponsor = {
  id: string;
  name: string;
  tier: SponsorTier;
  logo: string; // arquivo no volume de uploads
  logoAlt: string; // vazio = usa o nome (ver sponsorAlt)
  url: string; // vazio = logo sem link
  position: number;
};

export type SponsorInput = Omit<Sponsor, "id" | "position">;

type Row = { id: string; name: string; tier: SponsorTier; logo: string; logo_alt: string; url: string; position: number };

const toSponsor = (r: Row): Sponsor => ({
  id: r.id,
  name: r.name,
  tier: r.tier,
  logo: r.logo,
  logoAlt: r.logo_alt,
  url: r.url,
  position: r.position,
});

const tierOrder = (t: string) => {
  const i = sponsorCategories.findIndex((c) => c.id === t);
  return i === -1 ? sponsorCategories.length : i;
};

// Sem alt informado no painel, o nome da marca é o melhor texto alternativo
export const sponsorAlt = (s: Sponsor) => s.logoAlt || s.name;

export const isSponsorTier = (t: string): t is SponsorTier => sponsorCategories.some((c) => c.id === t);

// Ordem do site: categoria (na ordem de sponsorCategories) e, dentro dela, position
export async function listSponsors(): Promise<Sponsor[]> {
  await ensureSchema();
  const rows = await sql<Row[]>`select * from sponsors order by position, created_at`;
  return rows.map(toSponsor).sort((a, b) => tierOrder(a.tier) - tierOrder(b.tier) || a.position - b.position);
}

// Mesma lista pra faixa do mural e pra seção de patrocinadores: uma query por requisição
export const listSponsorsCached = cache(listSponsors);

export async function getSponsor(id: string): Promise<Sponsor | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`select * from sponsors where id = ${id}`;
  return row ? toSponsor(row) : null;
}

// Entra no fim da categoria
export async function createSponsor(data: SponsorInput): Promise<Sponsor> {
  await ensureSchema();
  const [row] = await sql<Row[]>`
    insert into sponsors (name, tier, logo, logo_alt, url, position)
    values (${data.name}, ${data.tier}, ${data.logo}, ${data.logoAlt}, ${data.url},
      (select coalesce(max(position), -1) + 1 from sponsors where tier = ${data.tier}))
    returning *`;
  return toSponsor(row);
}

// Trocou de categoria: vai pro fim da nova
export async function updateSponsor(id: string, data: SponsorInput) {
  await ensureSchema();
  await sql`
    update sponsors set
      name = ${data.name},
      logo = ${data.logo},
      logo_alt = ${data.logoAlt},
      url = ${data.url},
      position = case when tier = ${data.tier} then position
        else (select coalesce(max(position), -1) + 1 from sponsors where tier = ${data.tier}) end,
      tier = ${data.tier},
      updated_at = now()
    where id = ${id}`;
}

// Devolve o removido, pra quem chamou apagar o arquivo do logo
export async function deleteSponsor(id: string): Promise<Sponsor | null> {
  await ensureSchema();
  const [row] = await sql<Row[]>`delete from sponsors where id = ${id} returning *`;
  return row ? toSponsor(row) : null;
}

// Sobe/desce uma posição dentro da categoria. Renumera a categoria inteira (0..n-1) na mesma
// transação, então empates ou buracos antigos em position não travam a troca.
export async function moveSponsor(id: string, direction: "up" | "down") {
  await ensureSchema();
  await sql.begin(async (tx) => {
    const [target] = await tx<Row[]>`select * from sponsors where id = ${id} for update`;
    if (!target) return;
    const siblings = await tx<Row[]>`
      select * from sponsors where tier = ${target.tier} order by position, created_at for update`;
    const ids = siblings.map((s) => s.id);
    const from = ids.indexOf(id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    for (const [position, sid] of ids.entries()) {
      await tx`update sponsors set position = ${position} where id = ${sid}`;
    }
  });
}
