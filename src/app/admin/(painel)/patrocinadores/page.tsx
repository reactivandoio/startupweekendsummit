import Image from "next/image";
import Link from "next/link";
import { removeSponsor, reorderSponsor } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Eyebrow } from "@/components/eyebrow";
import { SponsorForm } from "@/components/sponsor-form";
import { sponsorCategories } from "@/content/site";
import { listSponsors, sponsorAlt } from "@/lib/sponsors";
import { uploadUrl } from "@/lib/uploads";
import { buttonClass } from "@/components/button";

const btn = buttonClass("secondary", "sm");

export default async function PatrocinadoresPage() {
  const sponsors = await listSponsors();
  const groups = sponsorCategories
    .map((c) => ({ ...c, items: sponsors.filter((s) => s.tier === c.id) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Patrocinadores</Eyebrow>
        <h1 className="font-display text-heading">
          {sponsors.length} {sponsors.length === 1 ? "patrocinador" : "patrocinadores"}
        </h1>
        <p className="max-w-[40ch] text-body-md">
          Aparecem na home e em /patrocinio, agrupados por categoria e na ordem definida aqui. Sem nenhum cadastrado, a seção
          não aparece no site.
        </p>
        <SponsorForm />
      </div>

      {groups.length === 0 ? (
        <p className="self-start border-t border-ink pt-6 text-body-md">Nenhum patrocinador ainda.</p>
      ) : (
        <div className="flex flex-col gap-10 self-start">
          {groups.map((g) => (
            <section key={g.id} className="flex flex-col">
              <h2 className="border-b border-ink pb-2 font-display text-subheading">{g.label}</h2>
              <ul>
                {g.items.map((s, i) => (
                  <li key={s.id} className="grid gap-4 border-b border-ash py-4 sm:grid-cols-[160px_1fr_auto] sm:items-center">
                    <div className="relative h-20 w-40 border border-ash bg-paper">
                      <Image src={uploadUrl(s.logo)} alt={sponsorAlt(s)} fill unoptimized sizes="160px" className="logo-mono object-contain p-2" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="text-body-md font-semibold">{s.name}</p>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-caption underline underline-offset-4">
                          {s.url}
                        </a>
                      ) : (
                        <p className="text-caption">Sem link</p>
                      )}
                      <p className="text-caption">Alt: {s.logoAlt || <span className="italic">(vazio — usa o nome)</span>}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-self-end">
                      <form action={reorderSponsor}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit" className={btn} disabled={i === 0} aria-label={`Subir ${s.name}`} title="Subir">
                          ↑
                        </button>
                      </form>
                      <form action={reorderSponsor}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button type="submit" className={btn} disabled={i === g.items.length - 1} aria-label={`Descer ${s.name}`} title="Descer">
                          ↓
                        </button>
                      </form>
                      <Link href={`/admin/patrocinadores/${s.id}`} className={btn}>
                        Editar
                      </Link>
                      <form action={removeSponsor}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmSubmit message={`Excluir ${s.name}? O logo enviado também é apagado.`} className={btn}>
                          Excluir
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
