import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Painel", robots: { index: false, follow: false } };

// Tudo abaixo de /admin (exceto /admin/login) exige sessão
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireUser();
  return <AdminShell user={user}>{children}</AdminShell>;
}
