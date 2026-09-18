import "server-only";
import nodemailer from "nodemailer";
import { site } from "@/content/site";

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

export async function sendMail(opts: { to: string; subject: string; text: string; html: string }) {
  const from = process.env.EMAIL_FROM ?? `${site.shortName} <${site.contactEmail}>`;
  const t = transport();
  if (!t) {
    console.info(`[mail] (sem SMTP) para ${opts.to}: ${opts.subject}\n${opts.text}`);
    return;
  }
  await t.sendMail({ from, ...opts });
}

export function sendLoginLink(to: string, url: string) {
  const text = `Seu link de acesso ao painel do ${site.shortName}:\n\n${url}\n\nEle vale por 15 minutos e só pode ser usado uma vez. Se você não pediu este acesso, ignore este e-mail.`;
  const html = `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#0f0f0f;max-width:520px">
      <p style="font-size:13px;letter-spacing:.03em;text-transform:uppercase;font-weight:600;margin:0 0 16px">${site.shortName}</p>
      <h1 style="font-size:24px;font-weight:400;line-height:1.1;margin:0 0 24px">Seu link de acesso ao painel</h1>
      <p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;border:1px solid #0f0f0f;padding:16px 24px;color:#0f0f0f;text-decoration:none;font-size:18px">Entrar no painel</a></p>
      <p style="font-size:14px;line-height:1.4;margin:0 0 8px">Ou copie e cole no navegador:<br><a href="${url}" style="color:#0f0f0f">${url}</a></p>
      <p style="font-size:13px;line-height:1.4;color:#555;margin:24px 0 0">Vale por 15 minutos e só pode ser usado uma vez. Se você não pediu este acesso, ignore este e-mail.</p>
    </div>`;
  return sendMail({ to, subject: `Acesso ao painel — ${site.shortName}`, text, html });
}
