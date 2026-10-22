import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/content/site";
import { accessInviteMail, inviteMail, loginLinkMail, registrationConfirmedMail, registrationRejectedMail, registrationUnderReviewMail, type Mail } from "./mail-templates.ts";

export { ticketNumber } from "./mail-templates.ts";

// SMTP (Mailgun, mesmo do termhub). Sem SMTP_HOST configurado, loga o e-mail no console — útil em dev.
function transport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

export async function sendMail(opts: { to: string } & Mail) {
  const from = process.env.EMAIL_FROM ?? `${site.shortName} <${site.contactEmail}>`;
  const t = transport();
  if (!t) {
    console.info(`[mail] (sem SMTP) para ${opts.to}: ${opts.subject}\n${opts.text}`);
    return;
  }
  await t.sendMail({ from, ...opts });
}

export const sendLoginLink = (to: string, url: string) => sendMail({ to, ...loginLinkMail(url) });

// Convite de acesso ao painel: vai para quem acabou de ser cadastrado em /admin/usuarios (e no reenvio)
export const sendAccessInvite = (to: string, name: string, url: string, loginUrl: string) => sendMail({ to, ...accessInviteMail(name, url, loginUrl) });

export const sendInvite = (to: string, name: string, url: string) => sendMail({ to, ...inviteMail(name, url) });

type RegistrationMail = { id: string; email: string; name: string; cpf: string; amountCents: number; lotName?: string };

// Confirmação + ingresso: vale como comprovante e traz o número que a organização confere no credenciamento
export const sendRegistrationConfirmed = (reg: RegistrationMail) => sendMail({ to: reg.email, ...registrationConfirmedMail(reg) });

// Pagamento confirmado: convite recebe o ingresso; cadastro aberto (em análise) recebe o aviso de que o ingresso vem na aprovação
export const sendPaymentReceived = (reg: RegistrationMail & { approval: string | null }) =>
  reg.approval === "pending" ? sendMail({ to: reg.email, ...registrationUnderReviewMail(reg) }) : sendRegistrationConfirmed(reg);

// Decisão do painel sobre o cadastro aberto
export const sendRegistrationApproved = (reg: RegistrationMail) => sendMail({ to: reg.email, ...registrationConfirmedMail(reg, { approved: true }) });
export const sendRegistrationRejected = (reg: RegistrationMail) => sendMail({ to: reg.email, ...registrationRejectedMail(reg) });
