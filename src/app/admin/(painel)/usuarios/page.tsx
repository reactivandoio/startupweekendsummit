import { deleteUser } from "@/app/admin/actions";
import { Eyebrow } from "@/components/eyebrow";
import { UserForm } from "@/components/user-form";
import { listUsers, requireUser } from "@/lib/auth";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" });

export default async function UsuariosPage() {
  const me = await requireUser();
  const users = await listUsers();
  return (
    <div className="grid gap-15 md:grid-cols-[1fr_1.4fr]">
      <div className="flex flex-col gap-6">
        <Eyebrow>Acesso</Eyebrow>
        <h1 className="font-display text-heading">Quem pode entrar no painel</h1>
        <p className="max-w-[40ch] text-body-md">
          Quem estiver nesta lista recebe o link de acesso por e-mail ao entrar em /admin/login. Não há senha.
        </p>
        <UserForm />
      </div>
      <ul className="border-t border-ink self-start">
        {users.map((u) => (
          <li key={u.id} className="flex items-center justify-between gap-4 border-b border-ash py-4">
            <div className="flex flex-col gap-1">
              <p className="text-body-md font-semibold">{u.name || u.email}</p>
              {u.name && <p className="text-body">{u.email}</p>}
              <p className="text-caption">desde {fmt.format(new Date(u.createdAt))}</p>
            </div>
            {u.id === me.id ? (
              <span className="text-caption">você</span>
            ) : (
              <form action={deleteUser}>
                <input type="hidden" name="id" value={u.id} />
                <button type="submit" className="border border-ash px-3 py-2 text-caption transition-colors hover:border-ink">
                  Remover
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
