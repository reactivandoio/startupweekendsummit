import { removeInvite, resendInvite, toggleInvite } from "@/app/admin/actions";
import { CopyButton } from "@/components/copy-button";
import { Eyebrow } from "@/components/eyebrow";
import { InviteForm } from "@/components/invite-form";
import { listInvites, type Invite } from "@/lib/invites";
import { appUrl } from "@/lib/stripe";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });
const btn = "border border-ash px-3 py-2 text-caption transition-colors hover:border-ink dark:border-graphite dark:hover:border-paper";

const statusOf = (i: Invite) => (i.revokedAt ? "Revogado" : i.uses >= i.maxUses ? "Esgotado" : "Ativo");

export default async function ConvitesPage() {
  const invites = await listInvites();
  const active = invites.filter((i) => statusOf(i) === "Ativo").length;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Convites</Eyebrow>
        <h1 className="font-display text-heading">
          {active} {active === 1 ? "convite ativo" : "convites ativos"}
        </h1>
        <p className="max-w-[40ch] text-body-md">
          Cada convite gera um link /inscricao/&lt;código&gt;. Um checkout em andamento segura a vaga por 1 hora; só a inscrição paga
          consome a vaga de vez.
        </p>
        <InviteForm />
      </div>

      {invites.length === 0 ? (
        <p className="self-start border-t border-ink pt-6 text-body-md dark:border-paper">Nenhum convite ainda.</p>
      ) : (
        <ul className="self-start border-t border-ink dark:border-paper">
          {invites.map((i) => {
            const url = `${appUrl()}/inscricao/${i.code}`;
            const status = statusOf(i);
            return (
              <li key={i.id} className="grid gap-4 border-b border-ash py-6 dark:border-graphite md:grid-cols-[1.4fr_1fr_auto]">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="text-body-md font-semibold">{i.name || i.email || "Convite aberto"}</p>
                  {i.name && i.email && <p className="text-body">{i.email}</p>}
                  {i.note && <p className="text-caption">{i.note}</p>}
                  <code className="mt-1 break-all font-mono text-caption">{url}</code>
                </div>
                <div className="flex flex-col gap-1 text-body">
                  <p className="font-semibold">{status}</p>
                  <p className="text-caption">
                    {i.uses} de {i.maxUses} {i.maxUses === 1 ? "vaga" : "vagas"} · criado em {fmt.format(new Date(i.createdAt))}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 md:justify-self-end">
                  <CopyButton text={url} />
                  {i.email && !i.revokedAt && (
                    <form action={resendInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button type="submit" className={btn}>
                        Reenviar e-mail
                      </button>
                    </form>
                  )}
                  <form action={toggleInvite}>
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="action" value={i.revokedAt ? "reactivate" : "revoke"} />
                    <button type="submit" className={btn}>
                      {i.revokedAt ? "Reativar" : "Revogar"}
                    </button>
                  </form>
                  {i.uses === 0 && (
                    <form action={removeInvite}>
                      <input type="hidden" name="id" value={i.id} />
                      <button type="submit" className={btn}>
                        Excluir
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
