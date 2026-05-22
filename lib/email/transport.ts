import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { ReactElement } from "react";

interface SendMailOptions {
  to: string | string[];
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
}

async function renderReactEmail(react: ReactElement): Promise<string> {
  const { render } = await import("@react-email/render");
  return render(react);
}

// ─── Resend Transport ─────────────────────────────────────────────────────────

async function sendViaResend(options: SendMailOptions) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.MAIL_FROM || "Helpdesk <noreply@example.com>";

  let html: string | undefined;
  if (options.react) {
    html = await renderReactEmail(options.react);
  } else {
    html = options.html;
  }

  const { error } = await resend.emails.send({
    from,
    to: Array.isArray(options.to) ? options.to : [options.to],
    subject: options.subject,
    html: html || options.text || "",
  });
  if (error) {
    console.error("[Resend] Failed to send email:", error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// ─── SMTP Transport (Gmail) ──────────────────────────────────────────────────

async function sendViaSmtp(options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  let html = options.html;
  if (!html && options.react) {
    html = await renderReactEmail(options.react);
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: Array.isArray(options.to) ? options.to.join(",") : options.to,
    subject: options.subject,
    html: html || undefined,
    text: options.text || undefined,
  });
}

// ─── Console Transport (dev fallback) ────────────────────────────────────────

function sendViaConsole(options: SendMailOptions) {
  console.log("─── [Email - Dev Mode] ───────────────────────────");
  console.log(`To: ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
  console.log(`Subject: ${options.subject}`);
  if (options.text) console.log(`Text: ${options.text}`);
  console.log("──────────────────────────────────────────────────");
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function sendMail(options: SendMailOptions): Promise<void> {
  const transport = process.env.MAIL_TRANSPORT || "resend";

  if (transport === "smtp" && process.env.GMAIL_APP_PASSWORD) {
    return sendViaSmtp(options);
  }

  if (transport === "resend" && process.env.RESEND_API_KEY) {
    return sendViaResend(options);
  }

  // Fallback: log to console in development
  sendViaConsole(options);
}
