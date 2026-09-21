import { deleteUser } from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { ResendAccessButton } from "@/components/resend-access-button";
import { UserForm } from "@/components/user-form";
import { listUsers, requireUser } from "@/lib/auth";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function UsuariosPage() {
  const me = await requireUser();
  const users = await listUsers();
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(280px,420px)_1fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Acesso</Eyebrow>
        <h1 className="font-display text-heading">Quem pode entrar no painel</h1>
        <p className="max-w-[40ch] text-body-md">
          Ao ser adicionada, a pessoa recebe por e-mail um convite com link de entrada. O link vale 15 minutos;
          depois disso ela pede outro em /admin/login com o mesmo e-mail. Não há senha.
        </p>
        <UserForm />
      </div>
      <ul className="border-t border-ink dark:border-paper self-start">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-4 border-b border-ash dark:border-graphite py-4">
            <div className="flex flex-col gap-1">
              <p className="text-body-md font-semibold">{u.name || u.email}</p>
              {u.name && <p className="text-body">{u.email}</p>}
              <p className="text-caption">desde {fmt.format(new Date(u.createdAt))}</p>
            </div>
            {u.id === me.id ? (
              <span className="text-caption">você</span>
            ) : (
              <div className="flex items-center gap-2">
                <ResendAccessButton id={u.id} />
                <form action={deleteUser}>
                  <input type="hidden" name="id" value={u.id} />
                  <button type="submit" className="border border-ash px-3 py-2 text-caption transition-colors hover:border-ink dark:border-graphite dark:hover:border-paper">
                    Remover
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
