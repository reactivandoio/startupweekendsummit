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

// Moldura comum dos e-mails transacionais, no mesmo vocabulário do link de acesso
function layout(title: string, body: string) {
  return `
    <div style="font-family:Inter,Helvetica,Arial,sans-serif;color:#0f0f0f;max-width:520px">
      <p style="font-size:13px;letter-spacing:.03em;text-transform:uppercase;font-weight:600;margin:0 0 16px">${site.shortName}</p>
      <h1 style="font-size:24px;font-weight:400;line-height:1.1;margin:0 0 24px">${title}</h1>
      ${body}
      <p style="font-size:13px;line-height:1.4;color:#555;margin:24px 0 0">${site.date} · ${site.city}. Dúvidas: <a href="${site.whatsappUrl}" style="color:#0f0f0f">WhatsApp ${site.whatsapp}</a> ou <a href="mailto:${site.contactEmail}" style="color:#0f0f0f">${site.contactEmail}</a>.</p>
    </div>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;border:1px solid #0f0f0f;padding:16px 24px;color:#0f0f0f;text-decoration:none;font-size:18px">${label}</a></p>`;

export function sendInvite(to: string, name: string, url: string) {
  const hi = name ? `Olá, ${name}.` : "Olá.";
  const text = `${hi}\n\nVocê foi convidado(a) para o ${site.name}, em ${site.city}, ${site.date}.\n\nGaranta sua vaga pelo link:\n${url}\n\nO link é pessoal. Dúvidas: ${site.whatsapp} ou ${site.contactEmail}.`;
  const html = layout(
    `Você foi convidado(a) para o ${site.shortName}`,
    `<p style="font-size:16px;line-height:1.4;margin:0 0 24px">${hi} Sua inscrição é por convite: preencha seus dados e conclua o pagamento pelo link abaixo.</p>
     ${button(url, "Fazer minha inscrição")}
     <p style="font-size:14px;line-height:1.4;margin:0 0 8px">Ou copie e cole no navegador:<br><a href="${url}" style="color:#0f0f0f">${url}</a></p>
     <p style="font-size:14px;line-height:1.4;margin:0">O link é pessoal — não compartilhe.</p>`,
  );
  return sendMail({ to, subject: `Seu convite — ${site.shortName}`, text, html });
}

export function sendRegistrationConfirmed(to: string, name: string, amountLabel: string) {
  const first = name.split(" ")[0];
  const text = `${first}, sua inscrição no ${site.name} está confirmada.\n\nPagamento de ${amountLabel} recebido. Guarde este e-mail: ele é o seu comprovante.\n\nNos vemos em ${site.city}, ${site.date}.`;
  const html = layout(
    "Inscrição confirmada.",
    `<p style="font-size:16px;line-height:1.4;margin:0 0 16px">${first}, recebemos o pagamento de <strong>${amountLabel}</strong> e sua vaga no ${site.name} está garantida.</p>
     <p style="font-size:16px;line-height:1.4;margin:0 0 24px">Guarde este e-mail: ele é o seu comprovante. Em breve mandamos a programação e as orientações pelo WhatsApp cadastrado.</p>
     <p style="font-size:16px;line-height:1.4;margin:0">Nos vemos em ${site.city}, ${site.date}.</p>`,
  );
  return sendMail({ to, subject: `Inscrição confirmada — ${site.shortName}`, text, html });
}
