// Primeiro nome pra saudação nos títulos ("Chega mais, Maria."): o cadastro pode vir todo em minúsculas ou maiúsculas
export function firstName(full: string): string {
  const first = full.trim().split(/\s+/)[0] ?? "";
  if (!first) return "";
  const lower = first.toLocaleLowerCase("pt-BR");
  return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
}
