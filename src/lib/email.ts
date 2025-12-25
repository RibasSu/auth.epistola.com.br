import type { Env } from "../types/auth";
import { getEmailTemplate } from "./email-templates";

export async function sendEmail(
  env: Env,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export async function sendVerificationEmail(
  env: Env,
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const verifyUrl = `${env.APP_URL}/verify-email?token=${token}`;
  const html = getEmailTemplate("verify", { name, verifyUrl });

  return sendEmail(env, email, "Confirme seu e-mail - Epístola", html);
}

export async function sendWelcomeEmail(
  env: Env,
  email: string,
  name: string
): Promise<boolean> {
  const dashboardUrl = `${env.APP_URL}/dashboard`;
  const html = getEmailTemplate("welcome", { name, dashboardUrl });

  return sendEmail(env, email, "Bem-vindo à Epístola!", html);
}

export async function sendPasswordResetEmail(
  env: Env,
  email: string,
  name: string,
  token: string
): Promise<boolean> {
  const resetUrl = `${env.APP_URL}/reset-password?token=${token}`;
  const html = getEmailTemplate("password-reset", { name, resetUrl });

  return sendEmail(env, email, "Redefinir senha - Epístola", html);
}

export async function send2FACodeEmail(
  env: Env,
  email: string,
  name: string,
  code: string
): Promise<boolean> {
  const html = getEmailTemplate("2fa-code", { name, code });

  return sendEmail(env, email, "Código de verificação 2FA - Epístola", html);
}

export async function sendEmailChangeConfirmation(
  env: Env,
  newEmail: string,
  name: string,
  token: string
): Promise<boolean> {
  const confirmUrl = `${env.APP_URL}/confirm-email-change?token=${token}`;
  const html = getEmailTemplate("email-change", { name, newEmail, confirmUrl });

  return sendEmail(env, newEmail, "Confirmar novo e-mail - Epístola", html);
}
