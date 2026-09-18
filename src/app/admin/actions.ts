"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addUser, logout, removeUser, requestLoginLink, requireUser } from "@/lib/auth";
import { deleteVolunteer } from "@/lib/volunteers";

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
