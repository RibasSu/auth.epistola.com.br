import type { Env, User } from "../types/auth";
import {
  hashPassword,
  verifyPassword,
  generateId,
  generateToken,
  signJWT,
  verifyJWT,
  jsonResponse,
  errorResponse,
} from "../lib/auth-utils";
import {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeEmail,
  sanitizeName,
} from "../lib/validator";
import { setCookie, deleteCookie, getAuthToken } from "../lib/cookies";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  send2FACodeEmail,
} from "../lib/email";
import { verifyTurnstile } from "../lib/turnstile";
import { verifyTOTP, generate2FAEmailCode } from "../lib/totp";

export async function registerUser(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const { email, password, name, turnstileToken } = await request.json();

    if (!turnstileToken) {
      return errorResponse("Verificação de segurança necessária");
    }

    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      env,
      request.headers.get("CF-Connecting-IP") || undefined
    );

    if (!turnstileValid) {
      return errorResponse("Verificação de segurança falhou");
    }

    if (!email || !password || !name) {
      return errorResponse("Email, password e nome são obrigatórios");
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return errorResponse(emailValidation.error || "Email inválido");
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return errorResponse(nameValidation.error || "Nome inválido");
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.error || "Senha inválida");
    }

    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);

    const existingUser = await env.DB.prepare(
      "SELECT id FROM users WHERE email = ?"
    )
      .bind(sanitizedEmail)
      .first();

    if (existingUser) {
      return errorResponse("Email já cadastrado", 409);
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const verificationToken = generateToken();
    const now = Date.now();
    const verificationExpires = now + 24 * 60 * 60 * 1000;

    await env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, name, email_verified, email_verification_token, email_verification_expires, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)`
    )
      .bind(
        userId,
        sanitizedEmail,
        passwordHash,
        sanitizedName,
        verificationToken,
        verificationExpires,
        now,
        now
      )
      .run();

    await sendVerificationEmail(
      env,
      sanitizedEmail,
      sanitizedName,
      verificationToken
    );

    const sessionId = generateToken();
    const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
    const expiresAt = now + sessionDuration;

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(sessionId, userId, expiresAt, now)
      .run();

    const tempToken = await signJWT(
      {
        sub: userId,
        email,
        name,
        verified: false,
        exp: Math.floor(expiresAt / 1000),
      },
      env.JWT_SECRET
    );

    const response = jsonResponse(
      {
        success: true,
        message: "Conta criada! Verifique seu e-mail para ativar sua conta.",
        user: { id: userId, email, name },
      },
      201
    );

    response.headers.append(
      "Set-Cookie",
      setCookie("session_token", tempToken, parseInt(env.SESSION_DURATION))
    );

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return errorResponse("Erro ao registrar usuário", 500);
  }
}

export async function loginUser(request: Request, env: Env): Promise<Response> {
  try {
    const { email, password, turnstileToken } = await request.json();

    if (!turnstileToken) {
      return errorResponse("Verificação de segurança necessária");
    }

    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      env,
      request.headers.get("CF-Connecting-IP") || undefined
    );

    if (!turnstileValid) {
      return errorResponse("Verificação de segurança falhou");
    }

    if (!email || !password) {
      return errorResponse("Email e senha são obrigatórios");
    }

    const sanitizedEmail = sanitizeEmail(email);

    const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?")
      .bind(sanitizedEmail)
      .first<User>();

    if (!user) {
      return errorResponse("Email ou senha inválidos", 401);
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return errorResponse("Email ou senha inválidos", 401);
    }

    if (user.email_verified === 0) {
      const sessionId = generateToken();
      const now = Date.now();
      const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
      const expiresAt = now + sessionDuration;

      await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(sessionId, user.id, expiresAt, now)
        .run();

      const tempToken = await signJWT(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          verified: false,
          exp: Math.floor(expiresAt / 1000),
        },
        env.JWT_SECRET
      );

      const response = errorResponse(
        "Email não verificado. Verifique sua caixa de entrada.",
        403
      );

      response.headers.append(
        "Set-Cookie",
        setCookie("session_token", tempToken, parseInt(env.SESSION_DURATION))
      );

      return response;
    }

    const twoFactorEnabled =
      user.totp_enabled === 1 || user.two_factor_email_enabled === 1;

    if (twoFactorEnabled) {
      const sessionId = generateToken();
      const now = Date.now();
      const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
      const expiresAt = now + sessionDuration;

      await env.DB.prepare(
        "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
      )
        .bind(sessionId, user.id, expiresAt, now)
        .run();

      const pendingToken = await signJWT(
        {
          sub: user.id,
          email: user.email,
          name: user.name,
          requires2fa: true,
          exp: Math.floor(expiresAt / 1000),
        },
        env.JWT_SECRET
      );

      const response = jsonResponse({
        success: true,
        requires2fa: true,
        methods: {
          app: user.totp_enabled === 1,
          email: user.two_factor_email_enabled === 1,
        },
      });

      response.headers.append(
        "Set-Cookie",
        setCookie("session_token", pendingToken, parseInt(env.SESSION_DURATION))
      );

      return response;
    }

    const sessionId = generateToken();
    const now = Date.now();
    const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
    const expiresAt = now + sessionDuration;

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(sessionId, user.id, expiresAt, now)
      .run();

    const token = await signJWT(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(expiresAt / 1000),
      },
      env.JWT_SECRET
    );

    const response = jsonResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      session: { expires_at: expiresAt },
    });

    response.headers.append(
      "Set-Cookie",
      setCookie("session_token", token, parseInt(env.SESSION_DURATION))
    );

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("Erro ao fazer login", 500);
  }
}

export async function verify2FALogin(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload.requires2fa) {
      return errorResponse("2FA não necessário", 400);
    }

    const body = (await request.json()) as {
      code: string;
      method: "app" | "email";
    };
    const { code, method } = body;

    if (!code || !method) {
      return errorResponse("Código e método são obrigatórios", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, name, avatar_url, totp_secret, totp_enabled, two_factor_email_enabled, backup_codes FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<
        User & {
          totp_secret: string | null;
          totp_enabled: number;
          two_factor_email_enabled: number;
          backup_codes: string | null;
        }
      >();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    let isValid = false;

    if (method === "app" && user.totp_enabled === 1 && user.totp_secret) {
      isValid = await verifyTOTP(user.totp_secret, code);

      if (!isValid && user.backup_codes) {
        const backupCodes = JSON.parse(user.backup_codes) as string[];
        const backupIndex = backupCodes.indexOf(code);
        if (backupIndex !== -1) {
          isValid = true;
          backupCodes.splice(backupIndex, 1);
          await env.DB.prepare(
            "UPDATE users SET backup_codes = ?, updated_at = ? WHERE id = ?"
          )
            .bind(
              JSON.stringify(backupCodes),
              Math.floor(Date.now() / 1000),
              user.id
            )
            .run();
        }
      }
    } else if (method === "email" && user.two_factor_email_enabled === 1) {
      const emailCodeRecord = await env.DB.prepare(
        "SELECT code, expires_at, used FROM two_factor_codes WHERE user_id = ? AND type = 'login' AND used = 0 ORDER BY created_at DESC LIMIT 1"
      )
        .bind(user.id)
        .first<{ code: string; expires_at: number; used: number }>();

      if (
        emailCodeRecord &&
        emailCodeRecord.code === code &&
        Date.now() / 1000 <= emailCodeRecord.expires_at
      ) {
        isValid = true;
        await env.DB.prepare(
          "UPDATE two_factor_codes SET used = 1 WHERE user_id = ? AND code = ?"
        )
          .bind(user.id, code)
          .run();
      }
    }

    if (!isValid) {
      return errorResponse("Código inválido ou expirado", 400);
    }

    const now = Date.now();
    const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
    const expiresAt = now + sessionDuration;

    const finalToken = await signJWT(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(expiresAt / 1000),
      },
      env.JWT_SECRET
    );

    const response = jsonResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      session: { expires_at: expiresAt },
    });

    response.headers.append(
      "Set-Cookie",
      setCookie("session_token", finalToken, parseInt(env.SESSION_DURATION))
    );

    return response;
  } catch (error) {
    console.error("Verify 2FA error:", error);
    return errorResponse("Erro ao verificar 2FA", 500);
  }
}

export async function send2FALoginCode(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);
    if (!payload.requires2fa) {
      return errorResponse("2FA não necessário", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, name, two_factor_email_enabled, last_2fa_code_sent, twofa_code_count FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<
        User & {
          two_factor_email_enabled: number;
          last_2fa_code_sent?: number;
          twofa_code_count?: number;
        }
      >();

    if (!user || user.two_factor_email_enabled !== 1) {
      return errorResponse("2FA por e-mail não está ativado", 400);
    }

    const now = Date.now();
    const codeCount = user.twofa_code_count || 0;
    const waitTime = Math.min(
      Math.pow(2, codeCount) * 60 * 1000,
      30 * 60 * 1000
    );

    if (user.last_2fa_code_sent && now - user.last_2fa_code_sent < waitTime) {
      const remainingSeconds = Math.ceil(
        (waitTime - (now - user.last_2fa_code_sent)) / 1000
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return errorResponse(
        `Aguarde ${remainingMinutes} minuto${
          remainingMinutes > 1 ? "s" : ""
        } antes de solicitar outro código`,
        429
      );
    }

    const code = generate2FAEmailCode();
    const expiresAt = Math.floor(Date.now() / 1000) + 600;
    const id = crypto.randomUUID();
    const newCodeCount = codeCount + 1;

    await env.DB.prepare(
      "INSERT INTO two_factor_codes (id, user_id, code, type, expires_at, used, created_at) VALUES (?, ?, ?, 'login', ?, 0, ?)"
    )
      .bind(id, user.id, code, expiresAt, Math.floor(Date.now() / 1000))
      .run();

    await env.DB.prepare(
      "UPDATE users SET last_2fa_code_sent = ?, twofa_code_count = ?, updated_at = ? WHERE id = ?"
    )
      .bind(now, newCodeCount, now, user.id)
      .run();

    await send2FACodeEmail(env, user.email, user.name, code);

    return jsonResponse({
      success: true,
      message: "Código enviado para seu e-mail ",
    });
  } catch (error) {
    console.error("Send 2FA login code error:", error);
    return errorResponse("Erro ao enviar código", 500);
  }
}

export async function logoutUser(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(payload.sub)
      .run();

    const response = jsonResponse({
      success: true,
      message: "Logout realizado",
    });
    response.headers.append("Set-Cookie", deleteCookie("session_token"));

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("Erro ao fazer logout", 500);
  }
}

export async function getUserProfile(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return jsonResponse({ success: false, error: "Não autenticado" });
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT id, email, name, avatar_url, email_verified, totp_enabled, two_factor_email_enabled, created_at FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<User>();

    if (!user) {
      return jsonResponse({ success: false, error: "Usuário não encontrado" });
    }

    return jsonResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      email_verified: user.email_verified,
      totp_enabled: user.totp_enabled,
      two_factor_email_enabled: user.two_factor_email_enabled,
      created_at: user.created_at,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Invalid signature" ||
        error.message === "Token expired" ||
        error.message === "Invalid token format")
    ) {
      return jsonResponse({ success: false, error: "Token inválido" });
    }
    console.error("Get profile error:", error);
    return errorResponse("Erro ao buscar perfil", 500);
  }
}

export async function updateUserProfile(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const { name, avatar_url } = await request.json();

    if (!name) {
      return errorResponse("Nome é obrigatório");
    }

    await env.DB.prepare(
      "UPDATE users SET name = ?, avatar_url = ?, updated_at = ? WHERE id = ?"
    )
      .bind(name, avatar_url, Date.now(), payload.sub)
      .run();

    return jsonResponse({
      success: true,
      message: "Perfil atualizado",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return errorResponse("Erro ao atualizar perfil", 500);
  }
}

export async function verifyEmail(
  request: Request,
  env: Env,
  token: string
): Promise<Response> {
  try {
    const user = await env.DB.prepare(
      "SELECT * FROM users WHERE email_verification_token = ? AND email_verification_expires > ?"
    )
      .bind(token, Date.now())
      .first<User>();

    if (!user) {
      return errorResponse("Token inválido ou expirado", 400);
    }

    await env.DB.prepare(
      "UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL, updated_at = ? WHERE id = ?"
    )
      .bind(Date.now(), user.id)
      .run();

    await sendWelcomeEmail(env, user.email, user.name);

    const sessionId = generateToken();
    const now = Date.now();
    const sessionDuration = parseInt(env.SESSION_DURATION) * 1000;
    const expiresAt = now + sessionDuration;

    await env.DB.prepare(
      "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(sessionId, user.id, expiresAt, now)
      .run();

    const jwtToken = await signJWT(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        exp: Math.floor(expiresAt / 1000),
      },
      env.JWT_SECRET
    );

    const response = jsonResponse({
      success: true,
      message: "Email verificado com sucesso!",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
      },
      session: { expires_at: expiresAt },
    });

    response.headers.append(
      "Set-Cookie",
      setCookie("session_token", jwtToken, parseInt(env.SESSION_DURATION))
    );

    return response;
  } catch (error) {
    console.error("Verify e-mail error:", error);
    return errorResponse("Erro ao verificar e-mail ", 500);
  }
}

export async function resendVerification(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const { turnstileToken } = await request.json();

    if (!turnstileToken) {
      return errorResponse("Verificação de segurança necessária");
    }

    const turnstileValid = await verifyTurnstile(
      turnstileToken,
      env,
      request.headers.get("CF-Connecting-IP") || undefined
    );

    if (!turnstileValid) {
      return errorResponse("Verificação de segurança falhou");
    }
    const authToken = await getAuthToken(request);
    if (!authToken) {
      return errorResponse("Não autorizado", 401);
    }

    const payload = await verifyJWT(authToken, env.JWT_SECRET);
    if (!payload || !payload.sub) {
      return errorResponse("Token inválido", 401);
    }

    const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?")
      .bind(payload.sub)
      .first<User>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 1) {
      return errorResponse("Email já verificado", 400);
    }

    const now = Date.now();
    const emailCount = user.verification_email_count || 0;
    const waitTime = Math.min(
      Math.pow(2, emailCount) * 60 * 1000,
      30 * 60 * 1000
    );

    if (
      user.last_verification_email_sent &&
      now - user.last_verification_email_sent < waitTime
    ) {
      const remainingSeconds = Math.ceil(
        (waitTime - (now - user.last_verification_email_sent)) / 1000
      );
      const remainingMinutes = Math.ceil(remainingSeconds / 60);
      return errorResponse(
        `Aguarde ${remainingMinutes} minuto${
          remainingMinutes > 1 ? "s" : ""
        } antes de reenviar o e-mail `,
        429
      );
    }

    const verificationToken = generateToken();
    const verificationExpires = now + 24 * 60 * 60 * 1000;
    const newEmailCount = emailCount + 1;

    await env.DB.prepare(
      "UPDATE users SET email_verification_token = ?, email_verification_expires = ?, last_verification_email_sent = ?, verification_email_count = ?, updated_at = ? WHERE id = ?"
    )
      .bind(
        verificationToken,
        verificationExpires,
        now,
        newEmailCount,
        now,
        user.id
      )
      .run();

    await sendVerificationEmail(env, user.email, user.name, verificationToken);

    return jsonResponse({
      success: true,
      message: "Email de verificação enviado!",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return errorResponse("Erro ao reenviar e-mail ", 500);
  }
}

export async function verifyUserPassword(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT password_hash FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ password_hash: string }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const { password } = await request.json();

    if (!password) {
      return errorResponse("Senha é obrigatória", 400);
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);

    if (!passwordMatch) {
      return errorResponse("Senha incorreta", 401);
    }

    return jsonResponse({
      success: true,
      valid: true,
    });
  } catch (error) {
    console.error("Verify password error:", error);
    return errorResponse("Erro ao verificar senha", 500);
  }
}
