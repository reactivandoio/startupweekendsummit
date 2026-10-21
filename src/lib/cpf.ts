// Validação e formatação de CPF. Sem "server-only": também serve pra máscara no cliente.

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

// Dígitos verificadores do CPF (módulo 11). Rejeita sequências repetidas como 111.111.111-11.
export function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

export const formatCpf = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
};

// Telefone BR só com dígitos (10 ou 11, com DDD) → (62) 99999-9999
export const formatPhone = (raw: string) => {
  const d = onlyDigits(raw);
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return raw;
};

export const formatBRL = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);

/* ---------- Máscaras progressivas (cliente) e normalização ---------- */

// 000.000.000-00 enquanto digita
export const maskCpf = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
};

// (62) 99999-9999 (celular, 9 dígitos) ou (62) 3333-4444 (fixo, 8 dígitos) enquanto digita
export const maskPhone = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const isValidPhone = (raw: string) => {
  const d = onlyDigits(raw);
  return (d.length === 10 || d.length === 11) && d[0] !== "0" && (d.length === 10 || d[2] === "9");
};

// E-mail sem espaços e em minúsculas; validação de formato simples (usuário@domínio.tld)
export const normalizeEmail = (raw: string) => raw.replace(/\s+/g, "").toLowerCase();
export const isValidEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(raw));

// dd/mm/aaaa enquanto digita; conversão de/para o ISO (YYYY-MM-DD) que o servidor espera
export const maskDateBr = (raw: string) => {
  const d = onlyDigits(raw).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};
export const dateBrToIso = (br: string) => {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "";
};
export const isoToDateBr = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};
export const isValidIsoDate = (s: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && d.getUTCFullYear() >= 1900 && d.getTime() < Date.now();
};
