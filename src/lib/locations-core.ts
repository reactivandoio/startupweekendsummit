// Estado e cidade da inscrição (opcionais). Os municípios ficam em public/municipios/<UF>.json (gerados do IBGE por
// scripts/municipios-ibge.mjs): o formulário carrega só o do estado escolhido e o servidor lê o mesmo arquivo para
// conferir que a cidade é do estado.

export const UFS = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export type Uf = (typeof UFS)[number]["uf"];

// [código IBGE, nome], como no arquivo do estado
export type City = readonly [number, string];

export const isUf = (v: unknown): v is Uf => typeof v === "string" && UFS.some((u) => u.uf === v);

export const ufName = (uf: string) => UFS.find((u) => u.uf === uf)?.name ?? uf;

export const citiesPath = (uf: Uf) => `/municipios/${uf}.json`;

// Busca sem acento e sem diferenciar maiúsculas: "sao jose" acha "São José"
export const foldSearch = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export function matchesSearch(label: string, query: string) {
  const q = foldSearch(query);
  return !q || foldSearch(label).includes(q);
}

// Código IBGE: 7 dígitos, os 2 primeiros são o código do estado
export const parseCityCode = (v: string): number | null => (/^\d{7}$/.test(v) ? Number(v) : null);

export function findCity(cities: readonly City[], code: number): City | null {
  return cities.find((c) => c[0] === code) ?? null;
}

export type PlaceInput = { company: string; uf: string; city: string };
export type ResolvedPlace = { company: string; uf: Uf | ""; cityCode: number | null; cityName: string };

// Valida o que veio do formulário. Tudo opcional, mas cidade só com estado, e só cidade daquele estado (lookup lê a
// lista do estado e devolve o nome oficial, ou null). Erros por campo, como os outros do formulário.
export async function resolvePlace(
  input: PlaceInput,
  lookup: (uf: Uf, code: number) => Promise<string | null>,
): Promise<{ ok: true; place: ResolvedPlace } | { ok: false; errors: { uf?: string; city?: string } }> {
  const company = input.company.replace(/\s+/g, " ").trim();
  if (!input.uf) {
    if (input.city) return { ok: false, errors: { uf: "Escolha o estado da cidade." } };
    return { ok: true, place: { company, uf: "", cityCode: null, cityName: "" } };
  }
  if (!isUf(input.uf)) return { ok: false, errors: { uf: "Estado inválido." } };
  if (!input.city) return { ok: true, place: { company, uf: input.uf, cityCode: null, cityName: "" } };
  const code = parseCityCode(input.city);
  const name = code === null ? null : await lookup(input.uf, code);
  if (code === null || !name) return { ok: false, errors: { city: "Escolha uma cidade do estado selecionado." } };
  return { ok: true, place: { company, uf: input.uf, cityCode: code, cityName: name } };
}

// Local da inscrição como aparece no painel: "Goiânia/GO", "GO" (sem cidade) ou "" (nada informado)
export const placeLabel = (r: { uf: string; cityName: string }) => (r.cityName ? `${r.cityName}/${r.uf}` : r.uf);
