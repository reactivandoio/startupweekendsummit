import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { citiesPath, findCity, type City, type Uf } from "@/lib/locations-core";

const cache = new Map<Uf, Promise<City[]>>();

// O mesmo arquivo que o formulário baixa (public/ vai junto na imagem de produção, e o servidor roda na raiz dela)
function loadCities(uf: Uf): Promise<City[]> {
  let p = cache.get(uf);
  if (!p) {
    p = readFile(path.join(process.cwd(), "public", citiesPath(uf)), "utf8").then((s) => JSON.parse(s) as City[]);
    p.catch(() => cache.delete(uf));
    cache.set(uf, p);
  }
  return p;
}

// Nome oficial da cidade, só se ela for do estado; null se não for
export async function cityOfUf(uf: Uf, code: number): Promise<string | null> {
  return findCity(await loadCities(uf), code)?.[1] ?? null;
}
