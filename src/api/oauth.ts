import type { Env } from "../types/auth";
import { validateEmail } from "../lib/validator";
import { verifyJWT } from "../lib/auth-utils";
import { getAuthToken } from "../lib/cookies";

const errorResponse = (error: string, status = 400) =>
  Response.json({ error }, { status });

const successResponse = (data: any) =>
  Response.json({ success: true, ...data });

function generateToken(): string {
  return crypto.randomUUID();
}

function isValidExternalId(id: string): boolean {
  return /^[a-zA-Z0-9]{1,10}$/.test(id);
}

async function verifyEpistolary(
  clientId: string,
  clientSecret: string,
  env: Env
): Promise<any> {
  const epistolary = await env.DB.prepare(
    "SELECT * FROM epistolaries WHERE client_id = ? AND client_secret = ? AND active = 1"
  )
    .bind(clientId, clientSecret)
    .first();

  return epistolary;
}

async function validatePermissions(
  scopes: string[],
  epistolary: any,
  env: Env
): Promise<{ valid: boolean; invalid?: string[] }> {
  const scopesStr = scopes.join(",");
  const permissions = await env.DB.prepare(
    `SELECT code, requires_verified, requires_official FROM permissions WHERE code IN (${scopes
      .map(() => "?")
      .join(",")}) AND active = 1`
  )
    .bind(...scopes)
    .all();

  if (!permissions.results || permissions.results.length !== scopes.length) {
    const validCodes = permissions.results?.map((p: any) => p.code) || [];
    const invalid = scopes.filter((s) => !validCodes.includes(s));
    return { valid: false, invalid };
  }

  for (const perm of permissions.results) {
    if (perm.requires_official && !epistolary.is_official) {
      return {
        valid: false,
        invalid: [perm.code + " (requer Epistolário oficial)"],
      };
    }
    if (perm.requires_verified && !epistolary.is_verified) {
      return {
        valid: false,
        invalid: [perm.code + " (requer Epistolário verificado)"],
      };
    }
  }

  return { valid: true };
}

export async function createOAuthSession(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      target_user?: string;
      external_id?: string;
      client_id: string;
      client_secret: string;
      scopes: string[];
      callback_url?: string;
    };

    const {
      target_user,
      external_id,
      client_id,
      client_secret,
      scopes,
      callback_url,
    } = body;

    if (!client_id || !client_secret) {
      return errorResponse("client_id e client_secret são obrigatórios");
    }

    if (!scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return errorResponse(
        "scopes deve ser um array com pelo menos uma permissão"
      );
    }

    const epistolary = await verifyEpistolary(client_id, client_secret, env);
    if (!epistolary) {
      return errorResponse("Credenciais inválidas", 401);
    }

    if (target_user && target_user !== "all") {
      if (!validateEmail(target_user)) {
        return errorResponse("target_user deve ser 'all' ou um e-mail válido");
      }
    }

    if (external_id && !isValidExternalId(external_id)) {
      return errorResponse(
        "external_id deve ter até 10 caracteres alfanuméricos"
      );
    }

    const scopeValidation = await validatePermissions(scopes, epistolary, env);
    if (!scopeValidation.valid) {
      return errorResponse(
        `Permissões inválidas: ${scopeValidation.invalid?.join(", ")}`
      );
    }

    const redirectUris = JSON.parse(epistolary.redirect_uris);
    let finalCallbackUrl = callback_url;

    if (!finalCallbackUrl) {
      if (redirectUris.length === 0) {
        return errorResponse("Nenhuma URL de callback configurada");
      }
      finalCallbackUrl = redirectUris[0];
    } else {
      if (!redirectUris.includes(finalCallbackUrl)) {
        return errorResponse(
          "callback_url não está na lista de URLs permitidas"
        );
      }
    }

    const sessionId = generateToken();
    const sessionToken = generateToken();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 600; // 10 minutos

    await env.DB.prepare(
      `INSERT INTO oauth_sessions (
        id, epistolary_id, session_token, external_id, target_user,
        requested_scopes, callback_url, status, expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
    )
      .bind(
        sessionId,
        epistolary.id,
        sessionToken,
        external_id || null,
        target_user || "all",
        JSON.stringify(scopes),
        finalCallbackUrl,
        expiresAt,
        now,
        now
      )
      .run();

    const authUrl = `${
      new URL(request.url).origin
    }/oauth/authorize?session=${sessionToken}`;

    return successResponse({
      auth_url: authUrl,
      session_token: sessionToken,
      expires_in: 600,
    });
  } catch (err: any) {
    console.error("Error creating OAuth session:", err);
    return errorResponse("Erro ao criar sessão de OAuth", 500);
  }
}

export async function getOAuthSessionStatus(
  request: Request,
  env: Env,
  sessionToken: string
): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Token de autenticação necessário", 401);
    }

    const clientSecret = authHeader.substring(7);

    const session = await env.DB.prepare(
      `SELECT os.*, e.client_secret, e.name as epistolary_name
       FROM oauth_sessions os
       JOIN epistolaries e ON os.epistolary_id = e.id
       WHERE os.session_token = ?`
    )
      .bind(sessionToken)
      .first();

    if (!session) {
      return errorResponse("Sessão não encontrada", 404);
    }

    if (session.client_secret !== clientSecret) {
      return errorResponse("Não autorizado", 403);
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > session.expires_at) {
      return successResponse({
        status: "expired",
        message: "Sessão expirada",
      });
    }

    const response: any = {
      status: session.status,
      external_id: session.external_id,
      created_at: session.created_at,
    };

    if (session.status === "completed") {
      response.access_token = session.access_token;
    } else if (session.status === "failed" || session.status === "cancelled") {
      response.error_code = session.error_code;
    }

    return successResponse(response);
  } catch (err: any) {
    console.error("Error getting OAuth session status:", err);
    return errorResponse("Erro ao consultar status da sessão", 500);
  }
}

export async function getUserData(
  request: Request,
  env: Env,
  accessToken: string
): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Token de autenticação necessário", 401);
    }

    const clientSecret = authHeader.substring(7);

    const tokenData = await env.DB.prepare(
      `SELECT ot.*, e.client_secret, u.id as user_id, u.email, u.name, u.avatar_url
       FROM oauth_user_tokens ot
       JOIN epistolaries e ON ot.epistolary_id = e.id
       JOIN users u ON ot.user_id = u.id
       WHERE ot.token = ?`
    )
      .bind(accessToken)
      .first();

    if (!tokenData) {
      return errorResponse("Token inválido", 404);
    }

    if (tokenData.client_secret !== clientSecret) {
      return errorResponse("Não autorizado", 403);
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > tokenData.expires_at) {
      return errorResponse("Token expirado", 401);
    }

    const grantedScopes = JSON.parse(tokenData.granted_scopes);

    const userData: any = {};

    if (grantedScopes.includes("auth") || grantedScopes.includes("email")) {
      userData.email = tokenData.email;
    }

    if (grantedScopes.includes("auth") || grantedScopes.includes("name")) {
      userData.name = tokenData.name;
    }

    if (
      grantedScopes.includes("auth") ||
      grantedScopes.includes("avatar") ||
      grantedScopes.includes("profile")
    ) {
      userData.avatar_url = tokenData.avatar_url;
    }

    userData.user_id = tokenData.user_id;
    userData.scopes = grantedScopes;

    return successResponse({ user: userData });
  } catch (err: any) {
    console.error("Error getting user data:", err);
    return errorResponse("Erro ao obter dados do usuário", 500);
  }
}

export async function expandAuthScope(scopes: string[]): Promise<string[]> {
  const expanded = new Set<string>();

  for (const scope of scopes) {
    if (scope === "auth") {
      expanded.add("email");
      expanded.add("name");
      expanded.add("avatar");
    } else {
      expanded.add(scope);
    }
  }

  return Array.from(expanded);
}

export async function handleAuthorize(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const sessionToken = url.searchParams.get("session");

    if (!sessionToken) {
      return errorResponse("session token é obrigatório");
    }

    const session = await env.DB.prepare(
      `SELECT os.*, e.name as epistolary_name, e.logo_url, e.website_url, e.is_verified, e.is_official
       FROM oauth_sessions os
       JOIN epistolaries e ON os.epistolary_id = e.id
       WHERE os.session_token = ?`
    )
      .bind(sessionToken)
      .first();

    if (!session) {
      return errorResponse("Sessão não encontrada", 404);
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > session.expires_at) {
      return errorResponse("Sessão expirada", 400);
    }

    if (session.status !== "pending") {
      return errorResponse("Sessão já foi processada", 400);
    }

    const token = await getAuthToken(request);
    const isLoggedIn = !!token;
    let user = null;

    if (isLoggedIn) {
      try {
        const payload = await verifyJWT(token!, env.JWT_SECRET);
        user = await env.DB.prepare(
          "SELECT id, email, name FROM users WHERE id = ?"
        )
          .bind(payload.sub)
          .first();
      } catch (e) {
        // Invalid token, treat as not logged in
      }
    }

    const requestedScopes = JSON.parse(session.requested_scopes);
    const expandedScopes = await expandAuthScope(requestedScopes);

    const permissions = await env.DB.prepare(
      `SELECT code, name, description, is_critical FROM permissions WHERE code IN (${expandedScopes
        .map(() => "?")
        .join(",")}) AND active = 1`
    )
      .bind(...expandedScopes)
      .all();

    return Response.json({
      session_token: sessionToken,
      is_logged_in: isLoggedIn,
      user: user ? { email: user.email, name: user.name } : null,
      epistolary: {
        name: session.epistolary_name,
        logo_url: session.logo_url,
        website_url: session.website_url,
        is_verified: session.is_verified === 1,
        is_official: session.is_official === 1,
      },
      target_user: session.target_user,
      external_id: session.external_id,
      permissions: permissions.results || [],
    });
  } catch (err: any) {
    console.error("Error handling authorize:", err);
    return errorResponse("Erro ao processar autorização", 500);
  }
}

export async function approveOAuthSession(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      session_token: string;
    };

    const { session_token } = body;

    if (!session_token) {
      return errorResponse("session_token é obrigatório");
    }

    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Não autenticado", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const session = await env.DB.prepare(
      "SELECT * FROM oauth_sessions WHERE session_token = ?"
    )
      .bind(session_token)
      .first();

    if (!session) {
      return errorResponse("Sessão não encontrada", 404);
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > session.expires_at) {
      return errorResponse("Sessão expirada", 400);
    }

    if (session.status !== "pending") {
      return errorResponse("Sessão já foi processada", 400);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first();

    if (!user || user.email_verified !== 1) {
      return errorResponse("Usuário não verificado", 403);
    }

    if (session.target_user !== "all" && session.target_user !== user.email) {
      await env.DB.prepare(
        "UPDATE oauth_sessions SET status = 'failed', error_code = 'user_mismatch', updated_at = ? WHERE id = ?"
      )
        .bind(now, session.id)
        .run();

      const callbackUrl = new URL(session.callback_url);
      callbackUrl.searchParams.set("status", "failed");
      callbackUrl.searchParams.set("error", "user_mismatch");
      if (session.external_id) {
        callbackUrl.searchParams.set("external_id", session.external_id);
      }

      return successResponse({ redirect_url: callbackUrl.toString() });
    }

    const accessToken = generateToken();
    const tokenId = generateToken();
    const tokenExpiresAt = now + 3600; // 1 hora

    const requestedScopes = JSON.parse(session.requested_scopes);
    const expandedScopes = await expandAuthScope(requestedScopes);

    await env.DB.prepare(
      `INSERT INTO oauth_user_tokens (
        id, token, epistolary_id, user_id, session_id, granted_scopes, expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        tokenId,
        accessToken,
        session.epistolary_id,
        user.id,
        session.id,
        JSON.stringify(expandedScopes),
        tokenExpiresAt,
        now
      )
      .run();

    await env.DB.prepare(
      "UPDATE oauth_sessions SET status = 'completed', user_id = ?, access_token = ?, updated_at = ? WHERE id = ?"
    )
      .bind(user.id, accessToken, now, session.id)
      .run();

    const callbackUrl = new URL(session.callback_url);
    callbackUrl.searchParams.set("status", "success");
    callbackUrl.searchParams.set("token", accessToken);
    if (session.external_id) {
      callbackUrl.searchParams.set("external_id", session.external_id);
    }

    return successResponse({ redirect_url: callbackUrl.toString() });
  } catch (err: any) {
    console.error("Error approving OAuth session:", err);
    return errorResponse("Erro ao aprovar autorização", 500);
  }
}

export async function cancelOAuthSession(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      session_token: string;
    };

    const { session_token } = body;

    if (!session_token) {
      return errorResponse("session_token é obrigatório");
    }

    const session = await env.DB.prepare(
      "SELECT * FROM oauth_sessions WHERE session_token = ?"
    )
      .bind(session_token)
      .first();

    if (!session) {
      return errorResponse("Sessão não encontrada", 404);
    }

    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(
      "UPDATE oauth_sessions SET status = 'cancelled', error_code = 'user_cancelled', updated_at = ? WHERE id = ?"
    )
      .bind(now, session.id)
      .run();

    const callbackUrl = new URL(session.callback_url);
    callbackUrl.searchParams.set("status", "cancelled");
    callbackUrl.searchParams.set("error", "user_cancelled");
    if (session.external_id) {
      callbackUrl.searchParams.set("external_id", session.external_id);
    }

    return successResponse({ redirect_url: callbackUrl.toString() });
  } catch (err: any) {
    console.error("Error cancelling OAuth session:", err);
    return errorResponse("Erro ao cancelar autorização", 500);
  }
}
