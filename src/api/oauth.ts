import type { Env, Epistolary, User } from "../types/auth";
import {
  generateToken,
  verifyJWT,
  jsonResponse,
  errorResponse,
} from "../lib/auth-utils";
import { getAuthToken } from "../lib/cookies";

export async function authorize(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("client_id");
    const redirectUri = url.searchParams.get("redirect_uri");
    const scope = url.searchParams.get("scope") || "basic";
    const state = url.searchParams.get("state");

    if (!clientId || !redirectUri) {
      return errorResponse("client_id e redirect_uri são obrigatórios");
    }

    const epistolary = await env.DB.prepare(
      "SELECT * FROM epistolaries WHERE id = ? AND active = 1"
    )
      .bind(clientId)
      .first<Epistolary>();

    if (!epistolary) {
      return errorResponse("Epistolário não encontrado ou inativo", 404);
    }

    const allowedUris = JSON.parse(epistolary.redirect_uris);
    if (!allowedUris.includes(redirectUri)) {
      return errorResponse("redirect_uri não autorizada", 400);
    }

    const token = await getAuthToken(request);
    if (!token) {
      return jsonResponse({
        login_required: true,
        epistolary: {
          id: epistolary.id,
          name: epistolary.name,
          description: epistolary.description,
          logo_url: epistolary.logo_url,
          scopes: scope.split(" "),
        },
      });
    }

    let userId: string;

    try {
      const payload = await verifyJWT(token, env.JWT_SECRET);
      userId = payload.sub;
    } catch {
      return jsonResponse({
        login_required: true,
        epistolary: {
          id: epistolary.id,
          name: epistolary.name,
          description: epistolary.description,
          logo_url: epistolary.logo_url,
          scopes: scope.split(" "),
        },
      });
    }

    const code = generateToken();
    const now = Date.now();
    const codeDuration = parseInt(env.AUTH_CODE_DURATION) * 1000;
    const expiresAt = now + codeDuration;

    await env.DB.prepare(
      "INSERT INTO auth_codes (code, epistolary_id, user_id, redirect_uri, scopes, expires_at, used, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)"
    )
      .bind(code, clientId, userId, redirectUri, scope, expiresAt, now)
      .run();

    const callbackUrl = new URL(redirectUri);
    callbackUrl.searchParams.set("code", code);
    if (state) callbackUrl.searchParams.set("state", state);

    return Response.redirect(callbackUrl.toString(), 302);
  } catch (error) {
    console.error("Authorize error:", error);
    return errorResponse("Erro na autorização", 500);
  }
}

export async function token(request: Request, env: Env): Promise<Response> {
  try {
    const contentType = request.headers.get("Content-Type");
    let params: any;

    if (contentType?.includes("application/json")) {
      params = await request.json();
    } else {
      const formData = await request.formData();
      params = Object.fromEntries(formData.entries());
    }

    const {
      grant_type,
      code,
      client_id,
      client_secret,
      redirect_uri,
      refresh_token,
    } = params;

    if (!client_id || !client_secret) {
      return errorResponse("client_id e client_secret são obrigatórios", 401);
    }

    const epistolary = await env.DB.prepare(
      "SELECT * FROM epistolaries WHERE id = ? AND client_secret = ? AND active = 1"
    )
      .bind(client_id, client_secret)
      .first<Epistolary>();

    if (!epistolary) {
      return errorResponse("Credenciais inválidas", 401);
    }

    if (grant_type === "authorization_code") {
      if (!code || !redirect_uri) {
        return errorResponse("code e redirect_uri são obrigatórios");
      }

      const authCode = await env.DB.prepare(
        "SELECT * FROM auth_codes WHERE code = ? AND epistolary_id = ? AND redirect_uri = ? AND used = 0"
      )
        .bind(code, client_id, redirect_uri)
        .first<any>();

      if (!authCode) {
        return errorResponse("Código de autorização inválido", 400);
      }

      if (authCode.expires_at < Date.now()) {
        return errorResponse("Código expirado", 400);
      }

      await env.DB.prepare("UPDATE auth_codes SET used = 1 WHERE code = ?")
        .bind(code)
        .run();

      const accessToken = generateToken();
      const refreshTokenValue = generateToken();
      const now = Date.now();
      const accessDuration = parseInt(env.ACCESS_TOKEN_DURATION) * 1000;
      const refreshDuration = parseInt(env.REFRESH_TOKEN_DURATION) * 1000;
      const accessExpiresAt = now + accessDuration;
      const refreshExpiresAt = now + refreshDuration;

      await env.DB.prepare(
        "INSERT INTO access_tokens (token, epistolary_id, user_id, scopes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(
          accessToken,
          client_id,
          authCode.user_id,
          authCode.scopes,
          accessExpiresAt,
          now
        )
        .run();

      await env.DB.prepare(
        "INSERT INTO refresh_tokens (token, access_token, epistolary_id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(
          refreshTokenValue,
          accessToken,
          client_id,
          authCode.user_id,
          refreshExpiresAt,
          now
        )
        .run();

      const user = await env.DB.prepare(
        "SELECT id, email, name, avatar_url FROM users WHERE id = ?"
      )
        .bind(authCode.user_id)
        .first<User>();

      return jsonResponse({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: parseInt(env.ACCESS_TOKEN_DURATION),
        refresh_token: refreshTokenValue,
        scope: authCode.scopes,
        user: user,
      });
    } else if (grant_type === "refresh_token") {
      if (!refresh_token) {
        return errorResponse("refresh_token é obrigatório");
      }

      const refreshData = await env.DB.prepare(
        "SELECT * FROM refresh_tokens WHERE token = ? AND epistolary_id = ?"
      )
        .bind(refresh_token, client_id)
        .first<any>();

      if (!refreshData) {
        return errorResponse("Refresh token inválido", 400);
      }

      if (refreshData.expires_at < Date.now()) {
        return errorResponse("Refresh token expirado", 400);
      }

      await env.DB.prepare("DELETE FROM access_tokens WHERE token = ?")
        .bind(refreshData.access_token)
        .run();

      const newAccessToken = generateToken();
      const now = Date.now();
      const accessDuration = parseInt(env.ACCESS_TOKEN_DURATION) * 1000;
      const accessExpiresAt = now + accessDuration;

      const oldToken = await env.DB.prepare(
        "SELECT scopes FROM access_tokens WHERE token = ?"
      )
        .bind(refreshData.access_token)
        .first<any>();

      const scopes = oldToken?.scopes || "basic";

      await env.DB.prepare(
        "INSERT INTO access_tokens (token, epistolary_id, user_id, scopes, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
        .bind(
          newAccessToken,
          client_id,
          refreshData.user_id,
          scopes,
          accessExpiresAt,
          now
        )
        .run();

      await env.DB.prepare(
        "UPDATE refresh_tokens SET access_token = ? WHERE token = ?"
      )
        .bind(newAccessToken, refresh_token)
        .run();

      return jsonResponse({
        access_token: newAccessToken,
        token_type: "Bearer",
        expires_in: parseInt(env.ACCESS_TOKEN_DURATION),
        scope: scopes,
      });
    } else {
      return errorResponse("grant_type não suportado", 400);
    }
  } catch (error) {
    console.error("Token error:", error);
    return errorResponse("Erro ao gerar token", 500);
  }
}

export async function userInfo(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Token não fornecido", 401);
    }

    const token = authHeader.substring(7);

    const accessToken = await env.DB.prepare(
      "SELECT * FROM access_tokens WHERE token = ?"
    )
      .bind(token)
      .first<any>();

    if (!accessToken) {
      return errorResponse("Token inválido", 401);
    }

    if (accessToken.expires_at < Date.now()) {
      return errorResponse("Token expirado", 401);
    }

    const user = await env.DB.prepare(
      "SELECT id, email, name, avatar_url, email_verified, created_at FROM users WHERE id = ?"
    )
      .bind(accessToken.user_id)
      .first<User>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    const scopes = accessToken.scopes.split(" ");
    const userInfo: any = { id: user.id };

    if (scopes.includes("basic") || scopes.includes("profile")) {
      userInfo.name = user.name;
      userInfo.avatar_url = user.avatar_url;
    }

    if (scopes.includes("email")) {
      userInfo.email = user.email;
      userInfo.email_verified = user.email_verified === 1;
    }

    return jsonResponse(userInfo);
  } catch (error) {
    console.error("UserInfo error:", error);
    return errorResponse("Erro ao buscar informações do usuário", 500);
  }
}

export async function revokeToken(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const { token: tokenToRevoke, token_type_hint } = await request.json();

    if (!tokenToRevoke) {
      return errorResponse("token é obrigatório");
    }

    if (token_type_hint === "refresh_token") {
      const refreshToken = await env.DB.prepare(
        "SELECT access_token FROM refresh_tokens WHERE token = ?"
      )
        .bind(tokenToRevoke)
        .first<any>();

      if (refreshToken) {
        await env.DB.prepare("DELETE FROM access_tokens WHERE token = ?")
          .bind(refreshToken.access_token)
          .run();
      }

      await env.DB.prepare("DELETE FROM refresh_tokens WHERE token = ?")
        .bind(tokenToRevoke)
        .run();
    } else {
      await env.DB.prepare("DELETE FROM access_tokens WHERE token = ?")
        .bind(tokenToRevoke)
        .run();

      await env.DB.prepare("DELETE FROM refresh_tokens WHERE access_token = ?")
        .bind(tokenToRevoke)
        .run();
    }

    return jsonResponse({ success: true, message: "Token revogado" });
  } catch (error) {
    console.error("Revoke token error:", error);
    return errorResponse("Erro ao revogar token", 500);
  }
}
