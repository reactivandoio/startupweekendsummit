import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { LoginForm } from "@/components/login-form";
import { illustrations } from "@/components/page-hero";
import { site } from "@/content/site";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar no painel", robots: { index: false, follow: false } };

/* Entrada do painel no mesmo papel do site: logo, formulário e o Relógio da Avenida Goiás */
export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  if (await getCurrentUser()) redirect("/admin");
  const { erro } = await searchParams;
  const art = illustrations.relogio;
  return (
    <main className="flex flex-1 flex-col bg-paper text-ink">
      <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-12 px-4 py-6 sm:px-6 md:py-10">
        <Link href="/" aria-label={site.name} className="self-start">
          <Image src="/logo-positivo.svg" alt={site.name} width={129} height={60} priority className="h-[60px] w-auto" />
        </Link>
        <div className="grid items-center gap-12 md:grid-cols-[1fr_1fr] md:py-10">
          <div className="flex max-w-[480px] flex-col gap-6">
            <Eyebrow>Painel</Eyebrow>
            <h1 className="font-display text-heading-lg">Entrar com o seu e-mail.</h1>
            <p className="text-body-md">Sem senha: você recebe um link de acesso que vale por 15 minutos.</p>
            {erro === "token" && (
              <p className="border-2 border-ink bg-marigold-wash p-4 text-body" role="alert">
                — Esse link expirou ou já foi usado. Peça um novo abaixo.
              </p>
            )}
            <LoginForm />
          </div>
          <Image
            src={art.src}
            alt=""
            width={art.width}
            height={art.height}
            priority
            sizes="(min-width: 768px) 40vw, 0px"
            className="hidden h-auto w-full max-w-[420px] justify-self-end md:block"
          />
        </div>
      </div>
    </main>
  );
}
