import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { site } from "@/content/site";
import type { User } from "@/lib/auth";

const nav = [
  { href: "/admin", label: "Inscrições" },
  { href: "/admin/usuarios", label: "Usuários" },
];

/* Moldura do painel: barra preta com logo + links, conteúdo em branco */
export function AdminShell({ user, children }: { user: User; children: React.ReactNode }) {
  return (
    <>
      <header className="bg-obsidian text-paper">
        <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-6 px-4 py-5 sm:px-6">
          <Link href="/admin" aria-label="Painel">
            <Image src="/logo-negativo.png" alt={site.name} width={103} height={48} priority className="h-[48px] w-auto" />
          </Link>
          <nav className="flex items-center gap-6 text-body tracking-[0.03em]">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:underline hover:underline-offset-4">
                {n.label}
              </Link>
            ))}
            <form action={signOut}>
              <button type="submit" className="border border-paper px-4 py-2 transition-colors hover:bg-paper hover:text-obsidian">
                Sair
              </button>
            </form>
          </nav>
        </div>
        <p className="mx-auto max-w-page px-4 pb-4 text-caption sm:px-6">{user.email}</p>
      </header>
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-15 sm:px-6">{children}</main>
    </>
  );
}
