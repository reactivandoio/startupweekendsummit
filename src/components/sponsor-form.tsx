"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { saveSponsor, type SponsorFormState } from "@/app/admin/actions";
import { sponsorCategories } from "@/content/site";

type Editing = { id: string; name: string; tier: string; logoAlt: string; url: string; logoUrl: string };

// Sem `sponsor`: cadastro. Com `sponsor`: edição (o logo atual fica se nenhum arquivo novo for enviado).
export function SponsorForm({ sponsor }: { sponsor?: Editing }) {
  const [state, action, pending] = useActionState(saveSponsor, { status: "idle" } as SponsorFormState);
  const v = state.status === "error" && state.values ? state.values : sponsor;
  return (
    <form key={state.at ?? 0} action={action} className="flex flex-col gap-4">
      {sponsor && <input type="hidden" name="id" value={sponsor.id} />}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-name" className="text-body font-semibold">
          Nome
        </label>
        <input id="s-name" name="name" type="text" required maxLength={120} defaultValue={v?.name} className="field" placeholder="Ex.: Sebrae Goiás" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-tier" className="text-body font-semibold">
          Categoria
        </label>
        <select id="s-tier" name="tier" required defaultValue={v?.tier ?? ""} className="field">
          <option value="" disabled>
            Escolha
          </option>
          {sponsorCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-logo" className="text-body font-semibold">
          Logo
        </label>
        {sponsor && (
          <div className="relative h-20 w-40 border border-ash bg-paper dark:border-graphite">
            <Image src={sponsor.logoUrl} alt={sponsor.logoAlt || sponsor.name} fill unoptimized sizes="160px" className="object-contain p-2" />
          </div>
        )}
        <input
          id="s-logo"
          name="logo"
          type="file"
          required={!sponsor}
          accept="image/svg+xml,image/png,image/webp,image/jpeg"
          className="text-body file:mr-3 file:border file:border-ink file:bg-transparent file:px-3 file:py-2 file:text-caption dark:file:border-paper dark:file:text-paper"
        />
        <p className="text-caption">
          SVG de preferência; ou PNG/WebP com fundo transparente. Até 2 MB.{sponsor && " Deixe vazio para manter o atual."}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-alt" className="text-body font-semibold">
          Texto alternativo do logo
        </label>
        <input id="s-alt" name="logoAlt" type="text" maxLength={200} defaultValue={v?.logoAlt} className="field" placeholder="Ex.: Logo do Sebrae Goiás" />
        <p className="text-caption">Lido por leitores de tela. Se ficar vazio, usamos o nome.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-url" className="text-body font-semibold">
          Site do patrocinador
        </label>
        <input id="s-url" name="url" type="text" inputMode="url" maxLength={500} defaultValue={v?.url} className="field" placeholder="https://empresa.com.br" />
        <p className="text-caption">Opcional. O logo no site vira link para este endereço, em nova aba.</p>
      </div>
      {state.message && (
        <p className="text-caption font-semibold" role="status">
          — {state.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="self-start border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper dark:border-paper dark:hover:bg-paper dark:hover:text-ink disabled:cursor-not-allowed disabled:border-ash disabled:text-ink/50 disabled:hover:bg-transparent"
        >
          {pending ? "Salvando…" : sponsor ? "Salvar alterações" : "Adicionar patrocinador"}
        </button>
        {sponsor && (
          <Link href="/admin/patrocinadores" className="text-body underline underline-offset-4">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
