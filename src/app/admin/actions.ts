"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addUser, logout, removeUser, requestLoginLink, requireUser } from "@/lib/auth";
import { createInvite, deleteInvite, listInvites, reactivateInvite, revokeInvite } from "@/lib/invites";
import { sendInvite } from "@/lib/mail";
import { deleteUnpaidRegistration } from "@/lib/registrations";
import { appUrl } from "@/lib/stripe";
import { deleteVolunteer } from "@/lib/volunteers";

const inviteUrl = (code: string) => `${appUrl()}/inscricao/${code}`;

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

export async function requestLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Informe um e-mail válido." };
  try {
    await requestLoginLink(email);
  } catch (err) {
    console.error("[requestLogin]", err);
    return { status: "error", message: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  }
  // resposta idêntica com ou sem cadastro, pra não revelar quem tem acesso
  return { status: "sent", message: `Se ${email} tiver acesso, o link de entrada chega em instantes.` };
}

export async function signOut() {
  await logout();
  redirect("/admin/login");
}

export type UserFormState = { status: "idle" | "ok" | "error"; message?: string };

export async function createUser(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  const me = await requireUser();
  const email = String(formData.get("email") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Informe um e-mail válido." };
  await addUser(email, name, me.id);
  revalidatePath("/admin/usuarios");
  return { status: "ok", message: `${email} agora pode entrar no painel.` };
}

export async function deleteUser(formData: FormData) {
  const me = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id && id !== me.id) await removeUser(id);
  revalidatePath("/admin/usuarios");
}

export async function removeVolunteer(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteVolunteer(id);
  revalidatePath("/admin");
}

/* ---------- Convites e participantes ---------- */

export type InviteFormState = { status: "idle" | "ok" | "error"; message?: string; url?: string };

// Cria o convite e, se tiver e-mail, já envia o link
export async function createInviteAction(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const me = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const maxUses = Math.min(500, Math.max(1, Number(formData.get("maxUses") ?? 1) || 1));
  const send = formData.get("send") === "on";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: "error", message: "Informe um e-mail válido ou deixe em branco." };

  const invite = await createInvite({ name, email, note, maxUses, createdBy: me.id });
  const url = inviteUrl(invite.code);
  let message = "Convite criado.";
  if (email && send) {
    try {
      await sendInvite(email, name, url);
      message = `Convite criado e enviado para ${email}.`;
    } catch (err) {
      console.error("[createInviteAction] mail", err);
      message = "Convite criado, mas o e-mail não saiu. Copie o link e envie manualmente.";
    }
  }
  revalidatePath("/admin/convites");
  return { status: "ok", message, url };
}

export async function resendInvite(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const invite = (await listInvites()).find((i) => i.id === id);
  if (invite?.email) await sendInvite(invite.email, invite.name, inviteUrl(invite.code));
}

export async function toggleInvite(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  if (formData.get("action") === "reactivate") await reactivateInvite(id);
  else await revokeInvite(id);
  revalidatePath("/admin/convites");
}

export async function removeInvite(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteInvite(id);
  revalidatePath("/admin/convites");
}

export async function removeRegistration(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteUnpaidRegistration(id);
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/convites");
}
