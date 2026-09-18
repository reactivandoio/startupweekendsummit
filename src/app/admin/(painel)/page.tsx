import { removeVolunteer } from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { availabilityOptions, volunteerAreas } from "@/content/site";
import { listVolunteers } from "@/lib/volunteers";

const areaLabel = Object.fromEntries(volunteerAreas.map((a) => [a.value, a.label]));
const availLabel = Object.fromEntries(availabilityOptions.map((a) => [a.value, a.label]));
const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function InscricoesPage() {
  const volunteers = await listVolunteers();
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <Eyebrow>Voluntários</Eyebrow>
          <h1 className="font-display text-heading">
            {volunteers.length} {volunteers.length === 1 ? "inscrição" : "inscrições"}
          </h1>
        </div>
        <a href="/admin/inscricoes.csv" className="border border-ink px-6 py-3 text-body transition-colors hover:bg-ink hover:text-paper">
          Baixar CSV
        </a>
      </div>

      {volunteers.length === 0 ? (
        <p className="border-t border-ink pt-6 text-body-md">Nenhuma inscrição ainda.</p>
      ) : (
        <ul className="border-t border-ink">
          {volunteers.map((v) => (
            <li key={v.id} className="grid gap-4 border-b border-ash py-6 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              <div className="flex flex-col gap-1">
                <p className="text-body-md font-semibold">{v.name}</p>
                <a href={`mailto:${v.email}`} className="text-body underline underline-offset-4">
                  {v.email}
                </a>
                <a href={`https://wa.me/55${v.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-body underline underline-offset-4">
                  {v.phone}
                </a>
                <p className="text-caption">
                  {v.city} · {fmt.format(new Date(v.createdAt))}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-body">
                <p className="font-semibold">{areaLabel[v.area] ?? v.area}</p>
                <p className="text-caption">{v.experience === "sim" ? "Já foi voluntário" : "Primeira vez"}</p>
              </div>
              <div className="flex flex-col gap-1 text-body">
                {v.availability.map((a) => (
                  <p key={a}>{availLabel[a] ?? a}</p>
                ))}
                {v.motivation && <p className="mt-2 text-caption whitespace-pre-line">{v.motivation}</p>}
              </div>
              <form action={removeVolunteer} className="md:justify-self-end">
                <input type="hidden" name="id" value={v.id} />
                <button type="submit" className="border border-ash px-3 py-2 text-caption transition-colors hover:border-ink">
                  Remover
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
