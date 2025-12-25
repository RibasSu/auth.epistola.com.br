import type { Env, Epistolary } from "../types/auth";
import {
  generateId,
  generateToken,
  signJWT,
  verifyJWT,
  jsonResponse,
  errorResponse,
} from "../lib/auth-utils";
import { getAuthToken } from "../lib/cookies";

export async function createEpistolary(
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
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const { name, description, redirect_uris, logo_url, website_url, scopes } =
      await request.json();

    if (!name || !redirect_uris) {
      return errorResponse("Nome e redirect_uris são obrigatórios");
    }

    const uris = Array.isArray(redirect_uris) ? redirect_uris : [redirect_uris];
    if (uris.length === 0) {
      return errorResponse("Pelo menos uma redirect_uri é necessária");
    }

    const epistolaryId = generateId();
    const clientSecret = generateToken();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO epistolaries (id, user_id, name, description, redirect_uris, client_secret, logo_url, website_url, scopes, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    )
      .bind(
        epistolaryId,
        payload.sub,
        name,
        description || null,
        JSON.stringify(uris),
        clientSecret,
        logo_url || null,
        website_url || null,
        scopes || "basic",
        now,
        now
      )
      .run();

    return jsonResponse(
      {
        success: true,
        epistolary: {
          id: epistolaryId,
          name,
          description,
          redirect_uris: uris,
          client_secret: clientSecret,
          logo_url,
          website_url,
          scopes: scopes || "basic",
        },
      },
      201
    );
  } catch (error) {
    console.error("Create epistolary error:", error);
    return errorResponse("Erro ao criar epistolário", 500);
  }
}

export async function listEpistolaries(
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
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const epistolaries = await env.DB.prepare(
      "SELECT id, name, description, redirect_uris, logo_url, website_url, scopes, active, created_at FROM epistolaries WHERE user_id = ?"
    )
      .bind(payload.sub)
      .all();

    return jsonResponse({
      success: true,
      epistolaries: epistolaries.results.map((e: any) => ({
        ...e,
        redirect_uris: JSON.parse(e.redirect_uris),
      })),
    });
  } catch (error) {
    console.error("List epistolaries error:", error);
    return errorResponse("Erro ao listar epistolários", 500);
  }
}

export async function getEpistolary(
  request: Request,
  env: Env,
  epistolaryId: string
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const epistolary = await env.DB.prepare(
      "SELECT * FROM epistolaries WHERE id = ? AND user_id = ?"
    )
      .bind(epistolaryId, payload.sub)
      .first<Epistolary>();

    if (!epistolary) {
      return errorResponse("Epistolário não encontrado", 404);
    }

    return jsonResponse({
      success: true,
      epistolary: {
        ...epistolary,
        redirect_uris: JSON.parse(epistolary.redirect_uris),
      },
    });
  } catch (error) {
    console.error("Get epistolary error:", error);
    return errorResponse("Erro ao buscar epistolário", 500);
  }
}

export async function updateEpistolary(
  request: Request,
  env: Env,
  epistolaryId: string
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const epistolary = await env.DB.prepare(
      "SELECT id FROM epistolaries WHERE id = ? AND user_id = ?"
    )
      .bind(epistolaryId, payload.sub)
      .first();

    if (!epistolary) {
      return errorResponse("Epistolário não encontrado", 404);
    }

    const {
      name,
      description,
      redirect_uris,
      logo_url,
      website_url,
      scopes,
      active,
    } = await request.json();

    const updates: string[] = [];
    const bindings: any[] = [];

    if (name) {
      updates.push("name = ?");
      bindings.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      bindings.push(description);
    }
    if (redirect_uris) {
      updates.push("redirect_uris = ?");
      bindings.push(
        JSON.stringify(
          Array.isArray(redirect_uris) ? redirect_uris : [redirect_uris]
        )
      );
    }
    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      bindings.push(logo_url);
    }
    if (website_url !== undefined) {
      updates.push("website_url = ?");
      bindings.push(website_url);
    }
    if (scopes) {
      updates.push("scopes = ?");
      bindings.push(scopes);
    }
    if (active !== undefined) {
      updates.push("active = ?");
      bindings.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return errorResponse("Nenhum campo para atualizar");
    }

    updates.push("updated_at = ?");
    bindings.push(Date.now());
    bindings.push(epistolaryId);

    await env.DB.prepare(
      `UPDATE epistolaries SET ${updates.join(", ")} WHERE id = ?`
    )
      .bind(...bindings)
      .run();

    return jsonResponse({
      success: true,
      message: "Epistolário atualizado",
    });
  } catch (error) {
    console.error("Update epistolary error:", error);
    return errorResponse("Erro ao atualizar epistolário", 500);
  }
}

export async function deleteEpistolary(
  request: Request,
  env: Env,
  epistolaryId: string
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const result = await env.DB.prepare(
      "DELETE FROM epistolaries WHERE id = ? AND user_id = ?"
    )
      .bind(epistolaryId, payload.sub)
      .run();

    if (result.meta.changes === 0) {
      return errorResponse("Epistolário não encontrado", 404);
    }

    return jsonResponse({
      success: true,
      message: "Epistolário removido",
    });
  } catch (error) {
    console.error("Delete epistolary error:", error);
    return errorResponse("Erro ao remover epistolário", 500);
  }
}

export async function regenerateSecret(
  request: Request,
  env: Env,
  epistolaryId: string
): Promise<Response> {
  try {
    const token = await getAuthToken(request);
    if (!token) {
      return errorResponse("Token não fornecido", 401);
    }

    const payload = await verifyJWT(token, env.JWT_SECRET);

    const user = await env.DB.prepare(
      "SELECT id, email_verified FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{ id: string; email_verified: number }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const epistolary = await env.DB.prepare(
      "SELECT id FROM epistolaries WHERE id = ? AND user_id = ?"
    )
      .bind(epistolaryId, payload.sub)
      .first();

    if (!epistolary) {
      return errorResponse("Epistolário não encontrado", 404);
    }

    const newSecret = generateToken();

    await env.DB.prepare(
      "UPDATE epistolaries SET client_secret = ?, updated_at = ? WHERE id = ?"
    )
      .bind(newSecret, Date.now(), epistolaryId)
      .run();

    return jsonResponse({
      success: true,
      client_secret: newSecret,
    });
  } catch (error) {
    console.error("Regenerate secret error:", error);
    return errorResponse("Erro ao regenerar secret", 500);
  }
}
