"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveSponsor, type SponsorFormState } from "@/app/admin/actions";
import { Button } from "@/components/button";
import { FileUpload } from "@/components/file-upload";
import { Select } from "@/components/select";
import { sponsorCategories } from "@/content/site";

const tierOptions = sponsorCategories.map((c) => ({ value: c.id, label: c.label }));

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
        <Select id="s-tier" name="tier" required options={tierOptions} defaultValue={v?.tier ?? ""} placeholder="Escolha" />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="s-logo" className="text-body font-semibold">
          Logo
        </label>
        <FileUpload
          id="s-logo"
          name="logo"
          required
          label="Arraste o logo aqui ou escolha no computador"
          current={sponsor ? { url: sponsor.logoUrl, alt: sponsor.logoAlt || sponsor.name } : undefined}
          hint={`SVG de preferência; ou PNG/WebP com fundo transparente. Até 2 MB.${sponsor ? " Para manter o atual, não escolha outro." : ""}`}
        />
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
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : sponsor ? "Salvar alterações" : "Adicionar patrocinador"}
        </Button>
        {sponsor && (
          <Link href="/admin/patrocinadores" className="text-body underline underline-offset-4">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}
