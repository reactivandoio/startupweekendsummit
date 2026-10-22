import { notFound } from "next/navigation";

// Qualquer rota inexistente sob /admin cai aqui (depois do login do layout) e mostra a 404 do painel, não a do site
export default function AdminCatchAll() {
  notFound();
}
