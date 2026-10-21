import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/eyebrow";
import { InviteForm } from "@/components/invite-form";
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
      <code className="break-all font-mono text-caption">{`${appUrl()}/inscricao/${invite.code}`}</code>
      <p className="text-body-md">
        O link não muda. Desconto e vagas valem para as próximas inscrições ({invite.uses} de {invite.maxUses} já usadas); as já feitas mantêm o
        valor que tiveram.
      </p>
      <InviteForm
        invite={{ id: invite.id, name: invite.name, email: invite.email, note: invite.note, maxUses: invite.maxUses, discount: invite.discount }}
      />
    </div>
  );
}
