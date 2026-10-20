"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addUser, createLoginUrl, getUser, logout, loginPageUrl, removeUser, requestLoginLink, requireUser } from "@/lib/auth";
import { createInvite, deleteInvite, listInvites, reactivateInvite, revokeInvite } from "@/lib/invites";
import { sendAccessInvite, sendInvite } from "@/lib/mail";
import { deleteUnpaidRegistration } from "@/lib/registrations";
import { createSponsor, deleteSponsor, getSponsor, isSponsorTier, moveSponsor, updateSponsor } from "@/lib/sponsors";
import { appUrl } from "@/lib/stripe";
import { deleteImageUpload, saveImageUpload } from "@/lib/uploads";
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
  const user = await addUser(email, name, me.id);
  revalidatePath("/admin/usuarios");

  // O acesso já está dado; o convite é o que avisa a pessoa. Se o e-mail não sair,
  // diga isso em vez de deixar quem convidou achando que a mensagem foi entregue.
  try {
    await sendAccessInvite(user.email, user.name, await createLoginUrl(user.email), loginPageUrl());
  } catch (err) {
    console.error("[createUser] convite de acesso", err);
    return { status: "error", message: `${email} já pode entrar, mas o convite não saiu. Confira o SMTP e use "Reenviar convite".` };
  }
  return { status: "ok", message: `${email} agora pode entrar no painel — convite enviado.` };
}

export async function resendAccessInvite(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const user = id ? await getUser(id) : null;
  if (!user) return { status: "error", message: "Usuário não encontrado." };
  try {
    await sendAccessInvite(user.email, user.name, await createLoginUrl(user.email), loginPageUrl());
  } catch (err) {
    console.error("[resendAccessInvite]", err);
    return { status: "error", message: "Não saiu. Confira o SMTP." };
  }
  return { status: "ok", message: `Convite reenviado para ${user.email}.` };
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

/* ---------- Patrocinadores ---------- */

type SponsorValues = { name: string; tier: string; logoAlt: string; url: string };
// values: o que foi digitado, pra repor no formulário quando a validação falha (o React o reseta após a action).
// at: muda a cada envio, vira a key do formulário pra ele remontar com esses valores.
export type SponsorFormState = { status: "idle" | "ok" | "error"; message?: string; values?: SponsorValues; at?: number };

const revalidateSponsors = () => {
  revalidatePath("/admin/patrocinadores");
  revalidatePath("/");
  revalidatePath("/patrocinio");
};

// "empresa.com.br" vira "https://empresa.com.br"; só http(s) passa
function normalizeUrl(raw: string): string | null {
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// Cria (sem id) ou edita (com id). Na edição o logo é opcional: sem arquivo novo, fica o atual.
export async function saveSponsor(_prev: SponsorFormState, formData: FormData): Promise<SponsorFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const tier = String(formData.get("tier") ?? "");
  const logoAlt = String(formData.get("logoAlt") ?? "").trim().slice(0, 200);
  const url = normalizeUrl(String(formData.get("url") ?? "").trim().slice(0, 500));
  const file = formData.get("logo");
  const hasFile = file instanceof File && file.size > 0;
  const fail = (message: string): SponsorFormState => ({
    status: "error",
    message,
    values: { name, tier, logoAlt, url: String(formData.get("url") ?? "").trim() },
    at: Date.now(),
  });

  if (!name) return fail("Informe o nome do patrocinador.");
  if (!isSponsorTier(tier)) return fail("Escolha a categoria.");
  if (url === null) return fail("URL do site inválida. Use o endereço completo, ex.: https://empresa.com.br");

  const current = id ? await getSponsor(id) : null;
  if (id && !current) return fail("Patrocinador não encontrado. Ele pode ter sido removido.");
  if (!current && !hasFile) return fail("Envie o logo.");

  let logo = current?.logo ?? "";
  if (hasFile) {
    const upload = await saveImageUpload(file);
    if (!upload.ok) return fail(upload.message);
    logo = upload.filename;
  }

  const data = { name, tier, logo, logoAlt, url };
  if (current) {
    await updateSponsor(current.id, data);
    if (logo !== current.logo) await deleteImageUpload(current.logo);
  } else {
    await createSponsor(data);
  }
  revalidateSponsors();
  if (current) redirect("/admin/patrocinadores");
  return { status: "ok", message: `${name} adicionado.`, at: Date.now() };
}

export async function removeSponsor(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const removed = id ? await deleteSponsor(id) : null;
  if (removed) await deleteImageUpload(removed.logo);
  revalidateSponsors();
}

export async function reorderSponsor(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (id) await moveSponsor(id, direction);
  revalidateSponsors();
}
