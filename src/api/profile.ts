import type { Env, User } from "../types/auth";
import { verifyJWT, hashPassword, verifyPassword } from "../lib/auth-utils";
import { getAuthToken } from "../lib/cookies";
import { jsonResponse, errorResponse } from "../lib/utils";
import { verifyTurnstileNonInteractive } from "../lib/turnstile";
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeEmail,
  sanitizeName,
} from "../lib/validator";
import {
  generateTOTPSecret,
  verifyTOTP,
  generateBackupCodes,
  generate2FAEmailCode,
  generateOTPAuthURL,
} from "../lib/totp";
import { send2FACodeEmail, sendEmailChangeConfirmation } from "../lib/email";

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

export async function generate2FASetup(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const user = await env.DB.prepare(
      "SELECT id, email, name FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const secret = generateTOTPSecret();
    const otpauthUrl = generateOTPAuthURL(secret, user.email);
    const backupCodes = generateBackupCodes();

    await env.DB.prepare(
      "UPDATE users SET totp_secret = ?, updated_at = ? WHERE id = ?"
    )
      .bind(secret, Math.floor(Date.now() / 1000), user.id)
      .run();

    return jsonResponse({
      success: true,
      secret,
      otpauthUrl,
      backupCodes,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        otpauthUrl
      )}`,
    });
  } catch (error) {
    console.error("Generate 2FA setup error:", error);
    return errorResponse("Erro ao gerar configuração 2FA", 500);
  }
}

export async function enable2FAApp(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as {
      emailCode: string;
      totpCode: string;
      backupCodes: string[];
      turnstileToken: string;
    };
    const { emailCode, totpCode, backupCodes, turnstileToken } = body;

    console.log("Enable 2FA Request:", {
      hasEmailCode: !!emailCode,
      hasTotpCode: !!totpCode,
      hasBackupCodes: !!backupCodes,
      hasTurnstile: !!turnstileToken,
    });

    if (!turnstileToken) {
      console.log("ERROR: No Turnstile token");
      return errorResponse("Verificação de segurança necessária", 400);
    }

    console.log("Verifying Turnstile Non-Interactive...");
    const turnstileValid = await verifyTurnstileNonInteractive(
      turnstileToken,
      env,
      request.headers.get("CF-Connecting-IP") || undefined
    );

    console.log("Turnstile verification result:", turnstileValid);

    if (!turnstileValid) {
      console.log("ERROR: Turnstile verification failed");
      return errorResponse("Verificação de segurança falhou", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, name, totp_secret FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User & { totp_secret: string }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const emailCodeRecord = await env.DB.prepare(
      "SELECT code, expires_at, used FROM two_factor_codes WHERE user_id = ? AND type = 'enable_totp' AND used = 0 ORDER BY created_at DESC LIMIT 1"
    )
      .bind(user.id)
      .first<{ code: string; expires_at: number; used: number }>();

    console.log("Email code check:", {
      found: !!emailCodeRecord,
      provided: emailCode,
      stored: emailCodeRecord?.code,
      match: emailCodeRecord?.code === emailCode,
    });

    if (!emailCodeRecord || emailCodeRecord.code !== emailCode) {
      console.log("ERROR: Email code invalid or not found");
      return errorResponse("Código de e-mail inválido", 400);
    }

    if (Date.now() / 1000 > emailCodeRecord.expires_at) {
      console.log("ERROR: Email code expired");
      return errorResponse("Código de e-mail expirado", 400);
    }

    if (!user.totp_secret) {
      console.log("ERROR: No TOTP secret found");
      return errorResponse("Configuração 2FA não encontrada", 400);
    }

    console.log("Verifying TOTP code...");
    const isValid = await verifyTOTP(user.totp_secret, totpCode);
    console.log("TOTP verification result:", isValid);

    if (!isValid) {
      console.log("ERROR: TOTP code invalid");
      return errorResponse("Código do app inválido", 400);
    }

    console.log("All validations passed, enabling 2FA...");

    await env.DB.prepare(
      "UPDATE users SET totp_enabled = 1, backup_codes = ?, updated_at = ? WHERE id = ?"
    )
      .bind(JSON.stringify(backupCodes), Math.floor(Date.now() / 1000), user.id)
      .run();

    await env.DB.prepare(
      "UPDATE two_factor_codes SET used = 1 WHERE user_id = ? AND code = ?"
    )
      .bind(user.id, emailCode)
      .run();

    return jsonResponse({
      success: true,
      message: "2FA por app ativado com sucesso",
    });
  } catch (error) {
    console.error("Enable 2FA app error:", error);
    return errorResponse("Erro ao ativar 2FA por app", 500);
  }
}

export async function disable2FAApp(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as {
      emailCode: string;
      appCode: string;
    };
    const { emailCode, appCode } = body;

    const user = await env.DB.prepare(
      "SELECT id, totp_secret, totp_enabled FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User & { totp_secret: string; totp_enabled: number }>();

    if (!user || !user.totp_enabled) {
      return errorResponse("2FA por app não está ativado", 400);
    }

    const emailCodeRecord = await env.DB.prepare(
      "SELECT code, expires_at, used FROM two_factor_codes WHERE user_id = ? AND type = 'disable_totp' AND used = 0 ORDER BY created_at DESC LIMIT 1"
    )
      .bind(user.id)
      .first<{ code: string; expires_at: number; used: number }>();

    if (!emailCodeRecord || emailCodeRecord.code !== emailCode) {
      return errorResponse("Código de e-mail inválido", 400);
    }

    if (Date.now() / 1000 > emailCodeRecord.expires_at) {
      return errorResponse("Código de e-mail expirado", 400);
    }

    const isValid = await verifyTOTP(user.totp_secret, appCode);
    if (!isValid) {
      return errorResponse("Código do app inválido", 400);
    }

    await env.DB.prepare(
      "UPDATE users SET totp_secret = NULL, totp_enabled = 0, backup_codes = NULL, updated_at = ? WHERE id = ?"
    )
      .bind(Math.floor(Date.now() / 1000), user.id)
      .run();

    await env.DB.prepare(
      "UPDATE two_factor_codes SET used = 1 WHERE user_id = ? AND code = ?"
    )
      .bind(user.id, emailCode)
      .run();

    return jsonResponse({
      success: true,
      message: "2FA por app desativado com sucesso",
    });
  } catch (error) {
    console.error("Disable 2FA app error:", error);
    return errorResponse("Erro ao desativar 2FA por app", 500);
  }
}

export async function send2FACode(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as {
      purpose: "enable_totp" | "disable_totp" | "change_email";
    };
    const { purpose } = body;

    if (!purpose) {
      return errorResponse("Tipo de código não especificado", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, name FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const code = generate2FAEmailCode();
    const expiresAt = Math.floor(Date.now() / 1000) + 600;
    const id = crypto.randomUUID();

    await env.DB.prepare(
      "INSERT INTO two_factor_codes (id, user_id, code, type, expires_at, used, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
    )
      .bind(
        id,
        user.id,
        code,
        purpose,
        expiresAt,
        Math.floor(Date.now() / 1000)
      )
      .run();

    await send2FACodeEmail(env, user.email, user.name, code);

    return jsonResponse({
      success: true,
      message: "Código enviado para seu e-mail ",
    });
  } catch (error) {
    console.error("Send 2FA code error:", error);
    return errorResponse("Erro ao enviar código", 500);
  }
}

export async function updateProfileName(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as { name: string };
    const { name } = body;

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return errorResponse(nameValidation.error || "Nome inválido", 400);
    }

    const sanitizedName = sanitizeName(name);

    await env.DB.prepare(
      "UPDATE users SET name = ?, updated_at = ? WHERE id = ?"
    )
      .bind(sanitizedName, Math.floor(Date.now() / 1000), payload.sub)
      .run();

    return jsonResponse({
      success: true,
      message: "Nome atualizado com sucesso",
    });
  } catch (error) {
    console.error("Update name error:", error);
    return errorResponse("Erro ao atualizar nome", 500);
  }
}

export async function changePassword(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as {
      currentPassword: string;
      newPassword: string;
    };
    const { currentPassword, newPassword } = body;

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.error || "Senha inválida", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, password_hash FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User & { password_hash: string }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.password_hash
    );
    if (!isPasswordValid) {
      return errorResponse("Senha atual incorreta", 400);
    }

    const newPasswordHash = await hashPassword(newPassword);

    await env.DB.prepare(
      "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?"
    )
      .bind(newPasswordHash, Math.floor(Date.now() / 1000), user.id)
      .run();

    return jsonResponse({
      success: true,
      message: "Senha alterada com sucesso",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return errorResponse("Erro ao alterar senha", 500);
  }
}

export async function requestEmailChange(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    const body = (await request.json()) as { newEmail: string };
    const { newEmail } = body;

    const emailValidation = validateEmail(newEmail);
    if (!emailValidation.valid) {
      return errorResponse(emailValidation.error || "Email inválido", 400);
    }

    const sanitizedEmail = sanitizeEmail(newEmail);

    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(sanitizedEmail)
      .first();

    if (existingUser) {
      return errorResponse("Este e-mail já está em uso", 400);
    }

    const user = await env.DB.prepare("SELECT id, name FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<User>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const changeToken = generateToken();
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;

    await env.DB.prepare(
      "UPDATE users SET pending_email = ?, pending_email_token = ?, pending_email_expires = ?, updated_at = ? WHERE id = ?"
    )
      .bind(
        sanitizedEmail,
        changeToken,
        expiresAt,
        Math.floor(Date.now() / 1000),
        user.id
      )
      .run();

    await sendEmailChangeConfirmation(
      env,
      sanitizedEmail,
      user.name,
      changeToken
    );

    return jsonResponse({
      success: true,
      message: "Link de confirmação enviado para o novo e-mail ",
    });
  } catch (error) {
    console.error("Request e-mail change error:", error);
    return errorResponse("Erro ao solicitar alteração de e-mail ", 500);
  }
}

export async function confirmEmailChange(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const changeToken = url.searchParams.get("token");

    if (!changeToken) {
      return errorResponse("Token não fornecido", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, pending_email, pending_email_token, pending_email_expires FROM users WHERE pending_email_token = ?"
    )
      .bind(changeToken)
      .first<
        User & {
          pending_email: string;
          pending_email_token: string;
          pending_email_expires: number;
        }
      >();

    if (!user) {
      return errorResponse("Token inválido", 400);
    }

    if (Date.now() / 1000 > user.pending_email_expires) {
      return errorResponse("Token expirado", 400);
    }

    await env.DB.prepare(
      "UPDATE users SET email = ?, pending_email = NULL, pending_email_token = NULL, pending_email_expires = NULL, updated_at = ? WHERE id = ?"
    )
      .bind(user.pending_email, Math.floor(Date.now() / 1000), user.id)
      .run();

    return jsonResponse({
      success: true,
      message: "Email alterado com sucesso",
    });
  } catch (error) {
    console.error("Confirm e-mail change error:", error);
    return errorResponse("Erro ao confirmar alteração de e-mail ", 500);
  }
}
