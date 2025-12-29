import type { Env, Epistolary } from "../types/auth";
import {
  generateId,
  generateToken,
  signJWT,
  verifyJWT,
  jsonResponse,
  errorResponse,
  verifyPassword,
} from "../lib/auth-utils";
import { getAuthToken } from "../lib/cookies";
import { sendEmail } from "../lib/email";
import { authenticator } from "otplib";

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

    for (const uri of uris) {
      if (!uri.startsWith("https://")) {
        return errorResponse(
          "Todas as redirect_uris devem usar HTTPS por questões de segurança"
        );
      }
    }

    const epistolaryId = generateId();
    const clientId = generateId();
    const clientSecret = generateToken();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO epistolaries (id, user_id, name, description, redirect_uris, client_id, client_secret, logo_url, website_url, is_verified, is_official, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 1, ?, ?)`
    )
      .bind(
        epistolaryId,
        payload.sub,
        name,
        description || null,
        JSON.stringify(uris),
        clientId,
        clientSecret,
        logo_url || null,
        website_url || null,
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
          client_id: clientId,
          client_secret: clientSecret,
          logo_url,
          website_url,
          is_verified: false,
          is_official: false,
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
      "SELECT id, name, description, redirect_uris, client_id, logo_url, website_url, is_verified, is_official, active, created_at FROM epistolaries WHERE user_id = ?"
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

    const { name, description, redirect_uris, logo_url, website_url, active } =
      await request.json();

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
      const uris = Array.isArray(redirect_uris)
        ? redirect_uris
        : [redirect_uris];
      for (const uri of uris) {
        if (!uri.startsWith("https://")) {
          return errorResponse(
            "Todas as redirect_uris devem usar HTTPS por questões de segurança"
          );
        }
      }
      updates.push("redirect_uris = ?");
      bindings.push(JSON.stringify(uris));
    }
    if (logo_url !== undefined) {
      updates.push("logo_url = ?");
      bindings.push(logo_url);
    }
    if (website_url !== undefined) {
      updates.push("website_url = ?");
      bindings.push(website_url);
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

export async function requestDeleteEpistolary(
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
      "SELECT id, email, name, password_hash, email_verified, totp_enabled, totp_secret FROM users WHERE id = ?"
    )
      .bind(payload.sub)
      .first<{
        id: string;
        email: string;
        name: string;
        password_hash: string;
        email_verified: number;
        totp_enabled: number;
        totp_secret: string | null;
      }>();

    if (!user) {
      return errorResponse("Usuário não encontrado", 404);
    }

    if (user.email_verified === 0) {
      return errorResponse("Email não verificado", 403);
    }

    const epistolary = await env.DB.prepare(
      "SELECT id, name FROM epistolaries WHERE id = ? AND user_id = ?"
    )
      .bind(epistolaryId, payload.sub)
      .first<{ id: string; name: string }>();

    if (!epistolary) {
      return errorResponse("Epistolário não encontrado", 404);
    }

    const { password, twofa_code } = await request.json();

    if (!password) {
      return errorResponse("Senha é obrigatória");
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return errorResponse("Senha incorreta", 401);
    }

    if (user.totp_enabled && user.totp_secret) {
      if (!twofa_code) {
        return errorResponse("Código 2FA é obrigatório");
      }

      const isValid = authenticator.verify({
        token: twofa_code,
        secret: user.totp_secret,
      });

      if (!isValid) {
        return errorResponse("Código 2FA inválido", 401);
      }
    }

    const deleteToken = generateToken();
    const expiresAt = Date.now() + 3600000;

    await env.DB.prepare(
      "INSERT INTO epistolary_delete_requests (token, epistolary_id, user_id, expires_at) VALUES (?, ?, ?, ?)"
    )
      .bind(deleteToken, epistolaryId, user.id, expiresAt)
      .run();

    const deleteUrl = `https://${
      new URL(request.url).host
    }/confirm-delete-epistolary?token=${deleteToken}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmar Exclusão de Epistolário</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Confirmar Exclusão</h1>
        </div>
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <p>Olá, <strong>${user.name}</strong>!</p>
          
          <p>Você solicitou a exclusão do epistolário:</p>
          <div style="background: white; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #dc2626; font-size: 18px;">${epistolary.name}</strong>
          </div>
          
          <div style="background: #fef2f2; border: 2px solid #fee2e2; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">ATENÇÃO: Esta ação é irreversível!</h3>
            <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px;">
              <li>Todas as integrações OAuth pararão de funcionar imediatamente</li>
              <li>O Client ID e Client Secret serão invalidados permanentemente</li>
              <li>Todos os tokens de acesso emitidos serão revogados</li>
              <li>Os dados do epistolário serão removidos do sistema</li>
            </ul>
          </div>
          
          <p><strong>Se você tem certeza que deseja prosseguir</strong>, clique no botão abaixo:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${deleteUrl}" style="background: #dc2626; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
              Confirmar Exclusão do Epistolário
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Não solicitou esta exclusão?</strong><br>
            Se você não solicitou a exclusão deste epistolário, simplesmente ignore este e-mail. Nenhuma ação será tomada.
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            Este link expira em 1 hora por questões de segurança.<br>
            Se não funcionar, copie e cole no navegador: <span style="color: #666;">${deleteUrl}</span>
          </p>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      env,
      user.email,
      `Confirmar exclusão do epistolário "${epistolary.name}"`,
      emailHtml
    );

    return jsonResponse({
      success: true,
      message: "Link de confirmação enviado para seu e-mail",
    });
  } catch (error) {
    console.error("Request delete epistolary error:", error);
    return errorResponse("Erro ao solicitar exclusão", 500);
  }
}

export async function confirmDeleteEpistolary(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const confirm = url.searchParams.get("confirm");

    if (!token) {
      return errorResponse("Token não fornecido", 400);
    }

    const deleteRequest = await env.DB.prepare(
      "SELECT * FROM epistolary_delete_requests WHERE token = ?"
    )
      .bind(token)
      .first<{
        token: string;
        epistolary_id: string;
        user_id: string;
        expires_at: number;
      }>();

    if (!deleteRequest) {
      return errorResponse("Link inválido ou já utilizado", 404);
    }

    if (Date.now() > deleteRequest.expires_at) {
      await env.DB.prepare(
        "DELETE FROM epistolary_delete_requests WHERE token = ?"
      )
        .bind(token)
        .run();
      return errorResponse("Link expirado", 410);
    }

    const epistolary = await env.DB.prepare(
      "SELECT name FROM epistolaries WHERE id = ?"
    )
      .bind(deleteRequest.epistolary_id)
      .first<{ name: string }>();

    if (request.method === "POST" && confirm === "true") {
      await env.DB.prepare(
        "DELETE FROM epistolaries WHERE id = ? AND user_id = ?"
      )
        .bind(deleteRequest.epistolary_id, deleteRequest.user_id)
        .run();

      await env.DB.prepare(
        "DELETE FROM epistolary_delete_requests WHERE token = ?"
      )
        .bind(token)
        .run();

      return jsonResponse({ success: true, message: "Epistolário excluído com sucesso" });
    }

    const confirmPage = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmar Exclusão - Epístola Auth</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { darkMode: 'class' }
  </script>
</head>
<body class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
  <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
    <div class="flex items-center justify-center mb-6">
      <div class="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
        <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>
    
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">Confirmação Final</h1>
    <p class="text-gray-600 dark:text-gray-400 mb-6 text-center">Você está prestes a excluir permanentemente o epistolário:</p>
    
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <p class="font-semibold text-red-900 dark:text-red-200 text-center">${epistolary?.name || ""}</p>
    </div>
    
    <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
      <ul class="text-sm text-amber-800 dark:text-amber-200 space-y-2">
        <li class="flex items-start gap-2">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span>Todas as integrações OAuth pararão de funcionar</span>
        </li>
        <li class="flex items-start gap-2">
          <svg class="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <span>Esta ação é irreversível</span>
        </li>
      </ul>
    </div>
    
    <button id="deleteBtn" disabled class="w-full h-12 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed mb-4" onclick="confirmDelete()">
      Aguarde <span id="countdown">5</span> segundos...
    </button>
    
    <a href="/dashboard" class="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-sm">
      Cancelar e voltar ao Dashboard
    </a>
  </div>
  
  <script>
    let countdown = 5;
    const btn = document.getElementById('deleteBtn');
    const countdownSpan = document.getElementById('countdown');
    
    const interval = setInterval(() => {
      countdown--;
      countdownSpan.textContent = countdown;
      
      if (countdown === 0) {
        clearInterval(interval);
        btn.disabled = false;
        btn.className = 'w-full h-12 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors mb-4 cursor-pointer';
        btn.textContent = 'Confirmar Exclusão Permanente';
      }
    }, 1000);
    
    async function confirmDelete() {
      btn.disabled = true;
      btn.textContent = 'Excluindo...';
      
      try {
        const res = await fetch('/confirm-delete-epistolary?token=${token}&confirm=true', {
          method: 'POST',
          credentials: 'include'
        });
        
        if (res.ok) {
          window.location.href = '/dashboard?deleted=true';
        } else {
          alert('Erro ao excluir epistolário');
        }
      } catch (error) {
        alert('Erro ao excluir epistolário');
      }
    }
  </script>
</body>
</html>`;

    return new Response(confirmPage, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("Confirm delete epistolary error:", error);
    return errorResponse("Erro ao confirmar exclusão", 500);
  }
}
