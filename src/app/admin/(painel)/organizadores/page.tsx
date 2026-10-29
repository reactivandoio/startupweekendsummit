import Image from "next/image";
import Link from "next/link";
import { removeOrganizer, reorderOrganizer, restoreOrganizer, toggleOrganizer } from "@/app/admin/actions";
import { buttonClass } from "@/components/button";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Eyebrow } from "@/components/eyebrow";
import { OrganizerForm } from "@/components/organizer-form";
import { RemovedList, RemovedToggle } from "@/components/removed-list";
import { SocialIcon } from "@/components/social-icon";
import { initials, socialName } from "@/lib/organizers-core";
import { listOrganizers, listRemovedOrganizers, organizerAlt } from "@/lib/organizers";
import { showingRemoved } from "@/lib/removal-core";
import { uploadUrl } from "@/lib/uploads";

const btn = buttonClass("secondary", "sm");

export default async function OrganizadoresPage({ searchParams }: PageProps<"/admin/organizadores">) {
  const showing = showingRemoved((await searchParams).removidos);
  const [organizers, removed] = await Promise.all([listOrganizers(), listRemovedOrganizers()]);
  const active = organizers.filter((o) => o.active).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Organizadores</Eyebrow>
        <h1 className="font-display text-heading">
          {organizers.length} {organizers.length === 1 ? "organizador" : "organizadores"}
        </h1>
        <p className="max-w-[40ch] text-body-md">
          Os ativos aparecem na home, na seção Organização, na ordem definida aqui. Sem nenhum ativo, a seção não aparece no
          site.{organizers.length > 0 ? ` Hoje: ${active} ${active === 1 ? "ativo" : "ativos"}.` : ""}
        </p>
        <RemovedToggle path="/admin/organizadores" count={removed.length} showing={showing} />
        <OrganizerForm />
      </div>

      {showing ? (
        <RemovedList
          className="self-start"
          empty="Nenhum organizador removido."
          restore={restoreOrganizer}
          items={removed.map((o) => ({
            ...o,
            title: o.name,
            detail: o.role,
            restoreMessage: `Restaurar ${o.name}? Volta no fim da lista${o.active ? " e aparece de novo no site" : ", inativo"}.`,
          }))}
        />
      ) : organizers.length === 0 ? (
        <p className="self-start border-t border-ink pt-6 text-body-md">Nenhum organizador ainda.</p>
      ) : (
        <ul className="self-start border-t border-ink">
          {organizers.map((o, i) => (
            <li key={o.id} className={`grid gap-4 border-b border-ash py-4 sm:grid-cols-[80px_1fr_auto] sm:items-center ${o.active ? "" : "opacity-60"}`}>
              <div className="relative size-20 border border-ash bg-ash">
                {o.photo ? (
                  <Image src={uploadUrl(o.photo)} alt={organizerAlt(o)} fill unoptimized sizes="80px" className="object-cover" />
                ) : (
                  <span aria-hidden="true" className="flex h-full items-center justify-center bg-marigold-wash font-display text-subheading">
                    {initials(o.name)}
                  </span>
                )}
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <p className="flex flex-wrap items-center gap-2 text-body-md font-semibold">
                  {o.name}
                  {!o.active && <span className="border border-ink px-1.5 py-0.5 text-caption font-semibold uppercase">Inativo</span>}
                </p>
                {o.role && <p className="text-caption">{o.role}</p>}
                {o.bio && <p className="line-clamp-2 text-caption text-graphite">{o.bio}</p>}
                {o.socials.length > 0 && (
                  <ul className="flex flex-wrap gap-2 pt-1">
                    {o.socials.map((s) => (
                      <li key={s.url}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${socialName(s.kind)} de ${o.name}`}
                          title={s.url}
                          className="flex size-8 items-center justify-center border border-ash hover:border-ink"
                        >
                          <SocialIcon kind={s.kind} size={16} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-self-end">
                <form action={reorderOrganizer}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" className={btn} disabled={i === 0} aria-label={`Subir ${o.name}`} title="Subir">
                    ↑
                  </button>
                </form>
                <form action={reorderOrganizer}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" className={btn} disabled={i === organizers.length - 1} aria-label={`Descer ${o.name}`} title="Descer">
                    ↓
                  </button>
                </form>
                <form action={toggleOrganizer}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="active" value={o.active ? "false" : "true"} />
                  <button type="submit" className={btn}>
                    {o.active ? "Desativar" : "Ativar"}
                  </button>
                </form>
                <Link href={`/admin/organizadores/${o.id}`} className={btn}>
                  Editar
                </Link>
                <form action={removeOrganizer}>
                  <input type="hidden" name="id" value={o.id} />
                  <ConfirmSubmit message={`Remover ${o.name}? Sai da lista e do site; dá para restaurar em Removidos.`} className={btn}>
                    Remover
                  </ConfirmSubmit>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
