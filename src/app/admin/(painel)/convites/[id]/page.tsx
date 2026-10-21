import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { InviteEditForm } from "@/components/invite-form";
import { getInvite } from "@/lib/invites";
import { appUrl } from "@/lib/stripe";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarConvitePage({ params }: PageProps<"/admin/convites/[id]">) {
  const { id } = await params;
  // id que não é uuid faria o Postgres lançar erro em vez de não achar
  const invite = UUID.test(id) ? await getInvite(id) : null;
  if (!invite) notFound();

  return (
    <div className="flex max-w-[480px] flex-col gap-6">
      <Eyebrow>Convites</Eyebrow>
      <h1 className="font-display text-heading">Editar {invite.name || invite.email || "convite"}</h1>
      <div className="flex flex-col gap-1">
        {invite.name && invite.email && <p className="text-body">{invite.email}</p>}
        <code className="break-all font-mono text-caption">{`${appUrl()}/inscricao/${invite.code}`}</code>
      </div>
      <p className="text-body-md">
        O desconto vale sobre o lote à venda no momento da inscrição e só para as próximas inscrições; as já feitas mantêm o valor que tiveram.
      </p>
      <InviteEditForm id={invite.id} discount={invite.discount} />
    </div>
  );
}
