// Gera public/municipios/<UF>.json a partir da API de localidades do IBGE: um arquivo por estado, carregado sob demanda
// pelo formulário de inscrição (cidade) e lido pelo servidor para validar que a cidade é do estado.
// Formato: [[código IBGE, "Nome"], ...] em ordem alfabética. Rodar só quando o IBGE criar/renomear município:
//   node scripts/municipios-ibge.mjs            (baixa da API)
//   node scripts/municipios-ibge.mjs lista.json (usa um JSON já baixado de /localidades/municipios?view=nivelado)
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado";
const out = path.join(process.cwd(), "public", "municipios");

const input = process.argv[2];
const list = input ? JSON.parse(await readFile(input, "utf8")) : await (await fetch(API)).json();

const byUf = new Map();
for (const m of list) {
  const uf = m["UF-sigla"];
  if (!byUf.has(uf)) byUf.set(uf, []);
  byUf.get(uf).push([m["municipio-id"], m["municipio-nome"]]);
}
if (byUf.size !== 27) throw new Error(`esperava 27 UFs, veio ${byUf.size}`);

await mkdir(out, { recursive: true });
const collator = new Intl.Collator("pt-BR");
for (const [uf, cities] of byUf) {
  cities.sort((a, b) => collator.compare(a[1], b[1]));
  await writeFile(path.join(out, `${uf}.json`), JSON.stringify(cities) + "\n");
}
console.log(`${list.length} municípios em ${byUf.size} arquivos (${out})`);
