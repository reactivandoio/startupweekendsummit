import { removeInvite, resendInvite, toggleInvite } from "@/app/admin/actions";
import { Button, ButtonLink } from "@/components/button";
import { CopyButton } from "@/components/copy-button";
import { Eyebrow } from "@/components/eyebrow";
import { InviteForm } from "@/components/invite-form";
import { describeDiscount } from "@/lib/discounts";
import { listInvites, type Invite } from "@/lib/invites";
import { appUrl } from "@/lib/stripe";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

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
          consome a vaga de vez. O desconto vale sobre o lote à venda no momento da inscrição; cortesia confirma sem Pix.
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
                  {i.discount.kind === "none" ? (
                    <p className="text-caption">Sem desconto</p>
                  ) : (
                    <p className="self-start border-2 border-grass bg-grass-wash px-2 py-0.5 text-caption font-semibold text-grass-deep">
                      {describeDiscount(i.discount)}
                    </p>
                  )}
                </div>
                {/* items-start: sem isso o botão solto (Copiar) estica na altura da linha da grade */}
                <div className="flex flex-wrap items-start gap-2 self-start md:justify-self-end">
                  <CopyButton text={url} />
                  <ButtonLink href={`/admin/convites/${i.id}`} size="sm">
                    Editar
                  </ButtonLink>
                  {i.email && !i.revokedAt && (
                    <form action={resendInvite} className="flex">
                      <input type="hidden" name="id" value={i.id} />
                      <Button type="submit" size="sm">
                        Reenviar e-mail
                      </Button>
                    </form>
                  )}
                  <form action={toggleInvite} className="flex">
                    <input type="hidden" name="id" value={i.id} />
                    <input type="hidden" name="action" value={i.revokedAt ? "reactivate" : "revoke"} />
                    <Button type="submit" size="sm">
                      {i.revokedAt ? "Reativar" : "Revogar"}
                    </Button>
                  </form>
                  {i.uses === 0 && (
                    <form action={removeInvite} className="flex">
                      <input type="hidden" name="id" value={i.id} />
                      <Button type="submit" size="sm">
                        Excluir
                      </Button>
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
