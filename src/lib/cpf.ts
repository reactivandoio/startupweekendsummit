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
