"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addUser, createLoginUrl, getUser, logout, loginPageUrl, removeUser, requestLoginLink, requireUser } from "@/lib/auth";
import { createInvite, deleteInvite, listInvites, reactivateInvite, revokeInvite } from "@/lib/invites";
import { sendAccessInvite, sendInvite } from "@/lib/mail";
import { checkApiKey, createWebhookEndpoint, reactivateWebhookEndpoint, rotateWebhookSecret, testWebhookEndpoint } from "@/lib/opapingou";
import { isOpaApiKey, isOpaTestKey, OpaApiError } from "@/lib/opapingou-core";
import { deleteUnpaidRegistration, listPendingOpaRegistrations } from "@/lib/registrations";
import { deleteSetting, getSetting, setSetting } from "@/lib/settings";
import { appUrl } from "@/lib/stripe";
import { syncCharge } from "@/lib/ticket-payments";
import { createLot, deleteLot, moveLot, updateLot } from "@/lib/tickets";
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

/* ---------- Ingressos: Opa Pingou e lotes ---------- */

export type OpaFormState = { status: "idle" | "ok" | "error"; message?: string };

const opaErrorMessage = (err: unknown) =>
  err instanceof OpaApiError
    ? `O Opa Pingou respondeu ${err.code}${err.requestId ? ` (requestId ${err.requestId})` : ""}.`
    : "Não conseguimos falar com o Opa Pingou. Tente de novo em instantes.";

// Salva a chave depois de validá-la na API. Trocar a chave invalida o webhook salvo (é de outra conta/modo).
export async function saveOpaKey(_prev: OpaFormState, formData: FormData): Promise<OpaFormState> {
  const me = await requireUser();
  const key = String(formData.get("apiKey") ?? "").trim();
  if (!isOpaApiKey(key)) return { status: "error", message: "A chave tem o formato opk_live_… ou opk_test_… (43 caracteres depois do prefixo)." };
  let check: Awaited<ReturnType<typeof checkApiKey>>;
  try {
    check = await checkApiKey(key);
  } catch (err) {
    console.error("[saveOpaKey]", err);
    return { status: "error", message: opaErrorMessage(err) };
  }
  if (!check.ok) return { status: "error", message: check.code === "API_KEY_EXPIRED" ? "Essa chave expirou. Gere outra no Opa Pingou." : "O Opa Pingou recusou a chave (inválida ou revogada)." };

  const previous = await getSetting("opapingou_api_key");
  await setSetting("opapingou_api_key", key, me.id);
  if (previous && previous !== key) {
    await deleteSetting("opapingou_webhook_id");
    await deleteSetting("opapingou_webhook_secret");
  }
  revalidatePath("/admin/ingressos");
  const mode = isOpaTestKey(key) ? "de teste" : "de produção";
  return { status: "ok", message: `Chave ${mode} salva${check.who ? ` (${check.who})` : ""}. Agora cadastre o webhook.` };
}

export async function removeOpaKey() {
  await requireUser();
  await deleteSetting("opapingou_api_key");
  await deleteSetting("opapingou_webhook_id");
  await deleteSetting("opapingou_webhook_secret");
  revalidatePath("/admin/ingressos");
}

// Cadastra o endpoint /api/opapingou/webhook. Se já existe, troca o segredo (o antigo se perdeu ou vazou).
export async function setupOpaWebhook(): Promise<OpaFormState> {
  const me = await requireUser();
  if (!(await getSetting("opapingou_api_key"))) return { status: "error", message: "Salve a chave do Opa Pingou primeiro." };
  const existing = await getSetting("opapingou_webhook_id");
  try {
    const endpoint = existing ? await rotateWebhookSecret(existing) : await createWebhookEndpoint(`${appUrl()}/api/opapingou/webhook`);
    await setSetting("opapingou_webhook_id", endpoint.id, me.id);
    await setSetting("opapingou_webhook_secret", endpoint.secret, me.id);
    if (endpoint.status === "DISABLED") await reactivateWebhookEndpoint(endpoint.id);
  } catch (err) {
    console.error("[setupOpaWebhook]", err);
    if (existing && err instanceof OpaApiError && err.code === "NOT_FOUND") {
      // removido do lado do Opa Pingou: esquece e deixa cadastrar de novo
      await deleteSetting("opapingou_webhook_id");
      await deleteSetting("opapingou_webhook_secret");
      revalidatePath("/admin/ingressos");
      return { status: "error", message: "O webhook salvo não existe mais no Opa Pingou. Clique de novo para cadastrar outro." };
    }
    if (err instanceof OpaApiError && err.code === "WEBHOOK_URL_INVALID") {
      return { status: "error", message: `O Opa Pingou só aceita URL https pública; a deste site é ${appUrl()} (confira APP_URL).` };
    }
    return { status: "error", message: opaErrorMessage(err) };
  }
  revalidatePath("/admin/ingressos");
  return { status: "ok", message: existing ? "Segredo do webhook trocado." : "Webhook cadastrado. Use \"Enviar teste\" para conferir a entrega." };
}

export async function testOpaWebhook(): Promise<OpaFormState> {
  await requireUser();
  const id = await getSetting("opapingou_webhook_id");
  if (!id) return { status: "error", message: "Cadastre o webhook primeiro." };
  try {
    const delivery = await testWebhookEndpoint(id);
    return { status: "ok", message: delivery.status === "SUCCEEDED" ? "Teste entregue: o site recebeu o ping." : `Teste enviado (entrega ${delivery.status}). Atualize em instantes.` };
  } catch (err) {
    console.error("[testOpaWebhook]", err);
    return { status: "error", message: opaErrorMessage(err) };
  }
}

// "R$ 1.234,56" / "350" / "350,00" → centavos
function parseCents(raw: string): number | null {
  const s = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const cents = Math.round(Number(s) * 100);
  return cents >= 1 && cents <= 2_500_000 ? cents : null; // limite do Opa Pingou: R$ 25.000,00
}

function lotFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const priceCents = parseCents(String(formData.get("price") ?? ""));
  const q = String(formData.get("quantity") ?? "").trim();
  const quantity = q === "" ? null : Math.max(0, Math.floor(Number(q)) || 0);
  return { name, priceCents, quantity };
}

export async function createLotAction(_prev: OpaFormState, formData: FormData): Promise<OpaFormState> {
  await requireUser();
  const { name, priceCents, quantity } = lotFields(formData);
  if (!name) return { status: "error", message: "Dê um nome ao lote (ex.: 1º lote)." };
  if (priceCents === null) return { status: "error", message: "Informe o valor em reais, entre R$ 0,01 e R$ 25.000,00." };
  await createLot({ name, priceCents, quantity });
  revalidatePath("/admin/ingressos");
  return { status: "ok", message: `Lote "${name}" criado.` };
}

export async function updateLotAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const { name, priceCents, quantity } = lotFields(formData);
  if (!id || !name || priceCents === null) return;
  await updateLot(id, { name, priceCents, quantity, active: formData.get("active") === "on" });
  revalidatePath("/admin/ingressos");
}

export async function moveLotAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const direction = formData.get("direction") === "up" ? "up" : "down";
  if (id) await moveLot(id, direction);
  revalidatePath("/admin/ingressos");
}

export async function removeLotAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await deleteLot(id);
  revalidatePath("/admin/ingressos");
}

// Confere na API as cobranças pendentes (caso algum webhook não tenha chegado)
export async function reconcileOpaCharges() {
  await requireUser();
  for (const reg of await listPendingOpaRegistrations()) await syncCharge(reg);
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/convites");
}
