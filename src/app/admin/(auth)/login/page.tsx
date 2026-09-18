import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { LoginForm } from "@/components/login-form";
import { site } from "@/content/site";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getCurrentUser()) redirect("/admin");
  const { erro } = await searchParams;
  return (
    <main className="flex flex-1 flex-col bg-obsidian text-paper">
      <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-12 px-4 py-16 sm:px-6 md:py-30">
        <Link href="/" aria-label={site.name} className="self-start">
          <Image src="/logo-negativo.png" alt={site.name} width={129} height={60} priority className="h-[60px] w-auto" />
        </Link>
        <div className="flex max-w-[520px] flex-col gap-6">
          <Eyebrow light>Painel</Eyebrow>
          <h1 className="font-display text-heading-lg">Entrar com o seu e-mail.</h1>
          <p className="text-body-md">Sem senha: você recebe um link de acesso que vale por 15 minutos.</p>
          {erro === "token" && (
            <p className="border border-paper p-4 text-body" role="alert">
              — Esse link expirou ou já foi usado. Peça um novo abaixo.
            </p>
          )}
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
