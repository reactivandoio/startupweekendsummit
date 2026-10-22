"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { addUser, createLoginUrl, getUser, logout, loginPageUrl, removeUser, requestLoginLink, requireUser } from "@/lib/auth";
import { parseBRLCents, parseDiscount } from "@/lib/discounts";
import { createInvite, deleteInvite, listInvites, reactivateInvite, revokeInvite, updateInvite } from "@/lib/invites";
import { sendAccessInvite, sendInvite, sendRegistrationApproved, sendRegistrationRejected } from "@/lib/mail";
import {
  checkApiKey,
  createWebhookEndpoint,
  deleteWebhookEndpoint,
  listWebhookEndpoints,
  opaWebhookUrl,
  reactivateWebhookEndpoint,
  rotateWebhookSecret,
  testWebhookEndpoint,
} from "@/lib/opapingou";
import { duplicateWebhooks, isOpaApiKey, isOpaTestKey, OpaApiError, planWebhookSetup } from "@/lib/opapingou-core";
import { deleteUnpaidRegistration, listPendingOpaRegistrations, reviewRegistration, setRefunded } from "@/lib/registrations";
import { deleteSetting, getSetting, setSetting } from "@/lib/settings";
import { createSponsor, deleteSponsor, getSponsor, isSponsorTier, moveSponsor, updateSponsor } from "@/lib/sponsors";
import { appUrl } from "@/lib/stripe";
import { parseTheme, themeLabel } from "@/lib/theme-core";
import { syncCharge } from "@/lib/ticket-payments";
import { createLot, deleteLot, moveLot, updateLot } from "@/lib/tickets";
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

type InviteValues = { name: string; email: string; note: string; maxUses: string; discountKind: string; discountValue: string };

// values/at: no erro, o formulário volta com o que foi digitado (o React limpa o form depois da action)
export type InviteFormState = { status: "idle" | "ok" | "error"; message?: string; url?: string; values?: InviteValues; at?: number };

const DISCOUNT_ERROR = "Desconto inválido: use um percentual inteiro de 1 a 100 ou um valor em reais (ex.: 50,00).";

// Campos do formulário de convite, com as mesmas regras na criação e na edição
function inviteFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const email = String(formData.get("email") ?? "").trim().slice(0, 200);
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  const maxUses = Math.min(500, Math.max(1, Number(formData.get("maxUses") ?? 1) || 1));
  const discount = parseDiscount(String(formData.get("discountKind") ?? "none"), String(formData.get("discountValue") ?? ""));
  const fail = (message: string): InviteFormState => ({
    status: "error",
    message,
    at: Date.now(),
    values: {
      name,
      email,
      note,
      maxUses: String(maxUses),
      discountKind: String(formData.get("discountKind") ?? "none"),
      discountValue: String(formData.get("discountValue") ?? ""),
    },
  });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: fail("Informe um e-mail válido ou deixe em branco.") } as const;
  if (!discount) return { error: fail(DISCOUNT_ERROR) } as const;
  return { data: { name, email, note, maxUses, discount } } as const;
}

// Cria o convite e, se tiver e-mail, já envia o link
export async function createInviteAction(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  const me = await requireUser();
  const fields = inviteFields(formData);
  if (fields.error) return fields.error;
  const { name, email } = fields.data;
  const send = formData.get("send") === "on";

  const invite = await createInvite({ ...fields.data, createdBy: me.id });
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

export async function updateInviteAction(_prev: InviteFormState, formData: FormData): Promise<InviteFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { status: "error", message: "Convite não encontrado." };
  const fields = inviteFields(formData);
  if (fields.error) return fields.error;
  await updateInvite(id, fields.data);
  revalidatePath("/admin/convites");
  redirect("/admin/convites");
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

/* ---------- Cadastro aberto: aprovação ---------- */

// Aprovada: manda o ingresso. A aprovação vale mesmo se o e-mail falhar (o erro fica no log, como nos pagamentos).
export async function approveRegistration(formData: FormData) {
  const me = await requireUser();
  const id = String(formData.get("id") ?? "");
  const reg = id ? await reviewRegistration(id, "approved", me.id) : null;
  if (reg) await sendRegistrationApproved(reg).catch((err) => console.error("[approveRegistration] mail", err));
  revalidatePath("/admin/participantes");
}

// Reprovada: fica marcada e libera a vaga do lote; o reembolso é manual no Opa Pingou. O aviso por e-mail é opcional.
export async function rejectRegistration(formData: FormData) {
  const me = await requireUser();
  const id = String(formData.get("id") ?? "");
  const reg = id ? await reviewRegistration(id, "rejected", me.id) : null;
  if (reg && formData.get("notify") === "on") await sendRegistrationRejected(reg).catch((err) => console.error("[rejectRegistration] mail", err));
  revalidatePath("/admin/participantes");
  revalidatePath("/admin/ingressos");
}

export async function toggleRefunded(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (id) await setRefunded(id, formData.get("refunded") === "1");
  revalidatePath("/admin/participantes");
}

export async function toggleOpenRegistration(formData: FormData) {
  const me = await requireUser();
  if (formData.get("enabled") === "1") await setSetting("open_registration", "on", me.id);
  else await deleteSetting("open_registration");
  revalidatePath("/admin/ingressos");
  revalidatePath("/inscricao/aberta");
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

export type ThemeFormState = { status: "idle" | "ok" | "error"; message?: string };

// Tema padrão do site (/admin/configuracoes). Vale pra quem ainda não escolheu um tema no botão do site.
export async function saveSiteTheme(_prev: ThemeFormState, formData: FormData): Promise<ThemeFormState> {
  const me = await requireUser();
  const theme = parseTheme(formData.get("theme"));
  if (!theme) return { status: "error", message: "Escolha Escuro ou Claro." };
  await setSetting("site_theme", theme, me.id);
  revalidatePath("/", "layout");
  return { status: "ok", message: `Tema padrão salvo: ${themeLabel[theme].toLowerCase()}. Quem já escolheu um tema no site continua com a escolha dele.` };
}

// Cadastra o endpoint /api/opapingou/webhook sem nunca criar um segundo para a mesma URL (ver planWebhookSetup):
// troca o segredo do salvo, adota um que já exista na conta ou, sem nenhum, cria.
export async function setupOpaWebhook(): Promise<OpaFormState> {
  const me = await requireUser();
  if (!(await getSetting("opapingou_api_key"))) return { status: "error", message: "Salve a chave do Opa Pingou primeiro." };
  const saved = await getSetting("opapingou_webhook_id");
  const url = opaWebhookUrl();
  let message: string;
  try {
    const endpoints = await listWebhookEndpoints();
    const plan = planWebhookSetup(endpoints, url, saved);
    const endpoint = plan.action === "rotate" ? await rotateWebhookSecret(plan.id) : await createWebhookEndpoint(url);
    await setSetting("opapingou_webhook_id", endpoint.id, me.id);
    await setSetting("opapingou_webhook_secret", endpoint.secret, me.id);
    if (endpoint.status === "DISABLED") await reactivateWebhookEndpoint(endpoint.id);
    message =
      plan.action === "create"
        ? 'Webhook cadastrado. Use "Enviar teste" para conferir a entrega.'
        : plan.id === saved
          ? "Segredo do webhook trocado."
          : 'Já havia um webhook para este site no Opa Pingou: passamos a usar esse, com segredo novo. Use "Enviar teste" para conferir.';
    const others = duplicateWebhooks(endpoints, url, endpoint.id).length;
    if (others > 0) message += ` Atenção: há ${others === 1 ? "outro cadastro" : `${others} outros cadastros`} para esta URL; exclua abaixo.`;
  } catch (err) {
    console.error("[setupOpaWebhook]", err);
    if (err instanceof OpaApiError && err.code === "NOT_FOUND") {
      // removido do lado do Opa Pingou entre a listagem e a troca: esquece e deixa cadastrar de novo
      await deleteSetting("opapingou_webhook_id");
      await deleteSetting("opapingou_webhook_secret");
      revalidatePath("/admin/ingressos");
      return { status: "error", message: "O webhook não existe mais no Opa Pingou. Clique de novo para cadastrar outro." };
    }
    if (err instanceof OpaApiError && err.code === "WEBHOOK_URL_INVALID") {
      return { status: "error", message: `O Opa Pingou só aceita URL https pública; a deste site é ${appUrl()} (confira APP_URL).` };
    }
    return { status: "error", message: opaErrorMessage(err) };
  }
  revalidatePath("/admin/ingressos");
  return { status: "ok", message };
}

// Exclui no Opa Pingou um cadastro duplicado da URL do site. Confere de novo na API que ele é duplicado
// (mesma URL e diferente do salvo) para nunca apagar o webhook em uso nem o de outro sistema da conta.
export async function deleteDuplicateOpaWebhook(_prev: OpaFormState, formData: FormData): Promise<OpaFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  try {
    const endpoints = await listWebhookEndpoints();
    const target = duplicateWebhooks(endpoints, opaWebhookUrl(), await getSetting("opapingou_webhook_id")).find((e) => e.id === id);
    if (!target) {
      revalidatePath("/admin/ingressos");
      return { status: "error", message: "Esse cadastro não é um duplicado deste site (ou já foi excluído)." };
    }
    await deleteWebhookEndpoint(id);
  } catch (err) {
    console.error("[deleteDuplicateOpaWebhook]", err);
    return { status: "error", message: opaErrorMessage(err) };
  }
  revalidatePath("/admin/ingressos");
  return { status: "ok", message: "Cadastro duplicado excluído." };
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
  const cents = parseBRLCents(raw);
  return cents !== null && cents >= 1 && cents <= 2_500_000 ? cents : null; // limite do Opa Pingou: R$ 25.000,00
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
