import type { Env } from "./types/auth";
import {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  verifyEmail,
  resendVerification,
  verify2FALogin,
  send2FALoginCode,
  verifyUserPassword,
} from "./api/auth";
import {
  createEpistolary,
  listEpistolaries,
  getEpistolary,
  updateEpistolary,
  deleteEpistolary,
  regenerateSecret,
  requestDeleteEpistolary,
  confirmDeleteEpistolary,
} from "./api/epistolary";
import {
  createOAuthSession,
  getOAuthSessionStatus,
  getUserData,
  handleAuthorize,
  approveOAuthSession,
  cancelOAuthSession,
} from "./api/oauth";
import { errorResponse, jsonResponse, verifyJWT } from "./lib/auth-utils";
import { getAuthToken } from "./lib/cookies";
import { cleanupUnverifiedUsers } from "./lib/cleanup";
import { VERIFY_2FA_PAGE } from "./pages/verify-2fa";
import { SETTINGS_PAGE } from "./pages/settings";
import { OAUTH_CONSENT_PAGE } from "./pages/oauth-consent";
import { DASHBOARD_PAGE } from "./pages/dashboard";
import {
  generate2FASetup,
  enable2FAApp,
  disable2FAApp,
  send2FACode,
  updateProfileName,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
} from "./api/profile";

const VERIFY_PENDING_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifique seu e-mail - Epístola Auth</title>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm text-center">
      <div class="flex justify-center">
        <svg class="w-16 h-16 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </div>
      <div class="grid gap-2">
        <h1 class="text-2xl font-semibold">Verifique seu e-mail</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Enviamos um link de verificação para seu e-mail. Clique no link para ativar sua conta.</p>
      </div>
      
      <div class="text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p class="mb-3">Não recebeu o e-mail? Verifique sua pasta de spam ou reenvie:</p>
        
        <form id="resendForm" class="grid gap-3">
          <div id="emailDisplay" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-1 text-sm flex items-center"></div>
          
          <div id="error" class="hidden text-sm text-red-600 dark:text-red-400"></div>
          <div id="success" class="hidden text-sm text-green-600 dark:text-green-400"></div>
          
          <div class="cf-turnstile" data-sitekey="1x00000000000000000000AA"></div>
          
          <button 
            type="submit"
            class="inline-flex items-center justify-center h-9 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Reenviar e-mail
          </button>
        </form>
      </div>

      <div class="text-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Voltar para login</a>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const darkIcon = document.getElementById('theme-toggle-dark-icon');
      const lightIcon = document.getElementById('theme-toggle-light-icon');
      if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
      } else {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
      }
    }

    updateThemeIcon();

    let userEmail = '';
    
    fetch('/api/auth/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          window.location.href = '/';
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.email) {
          window.location.href = '/';
          return;
        }
        if (data.email_verified === 1) {
          window.location.href = '/dashboard';
          return;
        }
        userEmail = data.email;
        document.getElementById('emailDisplay').textContent = userEmail;
      })
      .catch(() => {
        window.location.href = '/';
      });

    document.getElementById('resendForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const error = document.getElementById('error');
      const success = document.getElementById('success');
      const button = e.target.querySelector('button');
      const turnstileToken = document.querySelector('.cf-turnstile [name="cf-turnstile-response"]')?.value;
      
      if (!turnstileToken) {
        error.textContent = 'Complete a verificação de segurança';
        error.classList.remove('hidden');
        return;
      }
      
      error.classList.add('hidden');
      success.classList.add('hidden');
      button.disabled = true;
      button.textContent = 'Enviando...';
      
      try {
        const response = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turnstileToken }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          success.textContent = data.message;
          success.classList.remove('hidden');
        } else {
          error.textContent = data.error;
          error.classList.remove('hidden');
        }
      } catch (err) {
        error.textContent = 'Erro ao reenviar e-mail';
        error.classList.remove('hidden');
      } finally {
        button.disabled = false;
        button.textContent = 'Reenviar e-mail ';
      }
    });
  </script>
</body>
</html>`;

const VERIFY_EMAIL_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificando e-mail - Epístola Auth</title>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm text-center">
      <div id="loading" class="flex justify-center">
        <svg class="w-16 h-16 text-blue-500 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <div id="success" class="hidden flex justify-center">
        <svg class="w-16 h-16 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div id="error" class="hidden flex justify-center">
        <svg class="w-16 h-16 text-red-500 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
      </div>
      
      <div class="grid gap-2">
        <h1 id="title" class="text-2xl font-semibold">Verificando...</h1>
        <p id="message" class="text-sm text-gray-600 dark:text-gray-400"></p>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const darkIcon = document.getElementById('theme-toggle-dark-icon');
      const lightIcon = document.getElementById('theme-toggle-light-icon');
      if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
      } else {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
      }
    }

    updateThemeIcon();

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('error').classList.remove('hidden');
      document.getElementById('title').textContent = 'Token inválido';
      document.getElementById('message').innerHTML = '<a href="/" class="text-blue-600 dark:text-blue-400 hover:underline">Voltar para login</a>';
    } else {
      fetch('/api/auth/verify-email/' + token, {
        credentials: 'include'
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById('loading').classList.add('hidden');
        if (data.success) {
          document.getElementById('success').classList.remove('hidden');
          document.getElementById('title').textContent = 'Email verificado!';
          document.getElementById('message').textContent = 'Redirecionando para o dashboard...';
          setTimeout(() => window.location.href = '/dashboard', 2000);
        } else {
          document.getElementById('error').classList.remove('hidden');
          document.getElementById('title').textContent = 'Erro na verificação';
          document.getElementById('message').innerHTML = data.error + '<br><a href="/verify-pending" class="text-blue-600 dark:text-blue-400 hover:underline">Tentar novamente</a>';
        }
      })
      .catch(() => {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('title').textContent = 'Erro';
        document.getElementById('message').textContent = 'Erro ao verificar e-mail ';
      });
    }
  </script>
</body>
</html>`;

const HTML_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Epístola Auth</title>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div class="grid gap-2">
        <h1 class="text-2xl font-semibold">Entrar</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Sistema de Autenticação Epístola</p>
      </div>
      
      <form id="loginForm" class="grid gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="email">Email</label>
          <input 
            id="email" 
            type="email" 
            placeholder="maria.eduarda@muie.com.br"
            class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>
        
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="password">Senha</label>
          <input 
            id="password" 
            type="password"
            placeholder="••••••••"
            class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>
        
        <div id="error" class="hidden text-sm text-red-600 dark:text-red-400"></div>
        
        <div class="cf-turnstile" data-sitekey="1x00000000000000000000AA"></div>
        
        <button 
          type="submit"
          class="inline-flex items-center justify-center h-9 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2"
        >
          Entrar
        </button>
      </form>
      
      <div class="text-center text-sm">
        Não tem conta? <a href="/register" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Registrar</a>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
      updateThemeIcon();
    }
    
    function updateThemeIcon() {
      const darkIcon = document.getElementById('theme-toggle-dark-icon');
      const lightIcon = document.getElementById('theme-toggle-light-icon');
      if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
      } else {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
      }
    }
    
    updateThemeIcon();

    fetch('/api/auth/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/dashboard';
        }
      })
      .catch(() => {});

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const error = document.getElementById('error');
      const turnstileToken = document.querySelector('.cf-turnstile [name="cf-turnstile-response"]')?.value;
      
      if (!turnstileToken) {
        error.textContent = 'Complete a verificação de segurança';
        error.classList.remove('hidden');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, turnstileToken }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          if (data.requires2fa) {
            window.location.href = '/verify-2fa';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          if (response.status === 403 && data.error.includes('não verificado')) {
            window.location.href = '/verify-pending';
          } else {
            error.textContent = data.error;
            error.classList.remove('hidden');
          }
        }
      } catch (err) {
        error.textContent = 'Erro ao fazer login';
        error.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>`;

const REGISTER_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registrar - Epístola Auth</title>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>
  <div class="w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div class="grid gap-2">
        <h1 class="text-2xl font-semibold">Criar conta</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Preencha os dados para criar sua conta</p>
      </div>
      
      <form id="registerForm" class="grid gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="name">Nome</label>
          <input 
            id="name" 
            type="text" 
            placeholder="Seu nome"
            class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>

        <div class="grid gap-2">
          <label class="text-sm font-medium" for="email">Email</label>
          <input 
            id="email" 
            type="email" 
            placeholder="maria.eduarda@muie.com.br"
            class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>
        
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="password">Senha</label>
          <input 
            id="password" 
            type="password"
            placeholder="Mínimo 8 caracteres"
            class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
            minlength="8"
          />
        </div>
        
        <div id="error" class="hidden text-sm text-red-600 dark:text-red-400"></div>
        
        <div class="cf-turnstile" data-sitekey="1x00000000000000000000AA"></div>
        
        <button 
          type="submit"
          class="inline-flex items-center justify-center h-9 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2"
        >
          Criar conta
        </button>
      </form>
      
      <div class="text-center text-sm">
        Já tem conta? <a href="/" class="text-blue-600 dark:text-blue-400 hover:underline font-medium">Entrar</a>
      </div>
    </div>
  </div>

  <script>
    function toggleTheme() {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
      } else {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
      }
      updateThemeIcon();
    }

    function updateThemeIcon() {
      const darkIcon = document.getElementById('theme-toggle-dark-icon');
      const lightIcon = document.getElementById('theme-toggle-light-icon');
      if (document.documentElement.classList.contains('dark')) {
        darkIcon.classList.add('hidden');
        lightIcon.classList.remove('hidden');
      } else {
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
      }
    }

    updateThemeIcon();

    fetch('/api/auth/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/dashboard';
        }
      })
      .catch(() => {});

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const error = document.getElementById('error');
      const turnstileToken = document.querySelector('.cf-turnstile [name="cf-turnstile-response"]')?.value;
      
      if (!turnstileToken) {
        error.textContent = 'Complete a verificação de segurança';
        error.classList.remove('hidden');
        return;
      }
      
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, turnstileToken }),
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = '/verify-pending';
        } else {
          error.textContent = data.error;
          error.classList.remove('hidden');
        }
      } catch (err) {
        error.textContent = 'Erro ao criar conta';
        error.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>`;

export default {
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const deletedCount = await cleanupUnverifiedUsers(env);
        console.log(
          `Cleanup: ${deletedCount} contas não verificadas removidas`
        );
      })()
    );
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (path === "/" && method === "GET") {
      const token = await getAuthToken(request);
      if (token) {
        try {
          await verifyJWT(token, env.JWT_SECRET);
          return Response.redirect(
            new URL("/dashboard", request.url).toString(),
            302
          );
        } catch {
          // Token inválido, continua para a página de login
        }
      }

      const htmlPage = HTML_PAGE.replace(
        /data-sitekey="[^"]+"/g,
        `data-sitekey="${env.TURNSTILE_SITE_KEY}"`
      );
      return new Response(htmlPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/register" && method === "GET") {
      const registerPage = REGISTER_PAGE.replace(
        /data-sitekey="[^"]+"/g,
        `data-sitekey="${env.TURNSTILE_SITE_KEY}"`
      );
      return new Response(registerPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/dashboard" && method === "GET") {
      return new Response(DASHBOARD_PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/verify-pending" && method === "GET") {
      const verifyPage = VERIFY_PENDING_PAGE.replace(
        /data-sitekey="[^"]+"/g,
        `data-sitekey="${env.TURNSTILE_SITE_KEY}"`
      );
      return new Response(verifyPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/verify-email" && method === "GET") {
      return new Response(VERIFY_EMAIL_PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/verify-2fa" && method === "GET") {
      return new Response(VERIFY_2FA_PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/settings" && method === "GET") {
      const settingsPage = SETTINGS_PAGE.replace(
        /data-sitekey="TURNSTILE_SITE_KEY"/g,
        `data-sitekey="${env.TURNSTILE_SITE_KEY2}"`
      );
      return new Response(settingsPage, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const confirmEmailChangeMatch = path.match(/^\/confirm-email-change$/);
    if (confirmEmailChangeMatch && method === "GET") {
      return confirmEmailChange(request, env);
    }

    if (path === "/health" && method === "GET") {
      return jsonResponse({ status: "ok", service: "epistola-auth" });
    }

    if (path === "/api/auth/register" && method === "POST") {
      return registerUser(request, env);
    }

    if (path === "/api/auth/login" && method === "POST") {
      return loginUser(request, env);
    }

    if (path === "/api/auth/logout" && method === "POST") {
      return logoutUser(request, env);
    }

    if (path === "/api/auth/profile" && method === "GET") {
      return getUserProfile(request, env);
    }

    if (path === "/api/auth/profile" && method === "PUT") {
      return updateUserProfile(request, env);
    }

    if (path === "/api/auth/verify-password" && method === "POST") {
      return verifyUserPassword(request, env);
    }

    const verifyEmailMatch = path.match(
      /^\/api\/auth\/verify-email\/([^\/]+)$/
    );
    if (verifyEmailMatch && verifyEmailMatch[1] && method === "GET") {
      return verifyEmail(request, env, verifyEmailMatch[1]);
    }

    if (path === "/api/auth/resend-verification" && method === "POST") {
      return resendVerification(request, env);
    }

    if (path === "/api/auth/2fa/verify-login" && method === "POST") {
      return verify2FALogin(request, env);
    }

    if (path === "/api/auth/2fa/send-login-code" && method === "POST") {
      return send2FALoginCode(request, env);
    }

    if (path === "/api/profile/2fa/setup" && method === "POST") {
      return generate2FASetup(request, env);
    }

    if (path === "/api/profile/2fa/enable" && method === "POST") {
      return enable2FAApp(request, env);
    }

    if (path === "/api/profile/2fa/disable" && method === "POST") {
      return disable2FAApp(request, env);
    }

    if (path === "/api/profile/2fa/send-code" && method === "POST") {
      return send2FACode(request, env);
    }

    if (path === "/api/profile/name" && method === "PUT") {
      return updateProfileName(request, env);
    }

    if (path === "/api/profile/password" && method === "PUT") {
      return changePassword(request, env);
    }

    if (path === "/api/profile/email/change" && method === "POST") {
      return requestEmailChange(request, env);
    }

    if (path === "/api/epistolaries" && method === "GET") {
      return listEpistolaries(request, env);
    }

    if (path === "/api/epistolaries" && method === "POST") {
      return createEpistolary(request, env);
    }

    const epistolaryMatch = path.match(/^\/api\/epistolaries\/([^\/]+)$/);
    if (epistolaryMatch && epistolaryMatch[1]) {
      const id = epistolaryMatch[1];
      if (method === "GET") return getEpistolary(request, env, id);
      if (method === "PUT") return updateEpistolary(request, env, id);
      if (method === "DELETE") return deleteEpistolary(request, env, id);
    }

    const regenerateMatch = path.match(
      /^\/api\/epistolaries\/([^\/]+)\/regenerate$/
    );
    if (regenerateMatch && regenerateMatch[1] && method === "POST") {
      return regenerateSecret(request, env, regenerateMatch[1]);
    }

    const deleteRequestMatch = path.match(
      /^\/api\/epistolaries\/([^\/]+)\/request-delete$/
    );
    if (deleteRequestMatch && deleteRequestMatch[1] && method === "POST") {
      return requestDeleteEpistolary(request, env, deleteRequestMatch[1]);
    }

    if (
      path === "/confirm-delete-epistolary" &&
      (method === "GET" || method === "POST")
    ) {
      return confirmDeleteEpistolary(request, env);
    }

    if (path === "/oauth/authorize" && method === "GET") {
      return handleAuthorize(request, env);
    }

    if (path === "/oauth/authorize/page" && method === "GET") {
      return new Response(OAUTH_CONSENT_PAGE, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (path === "/api/oauth/session" && method === "POST") {
      return createOAuthSession(request, env);
    }

    const sessionStatusMatch = path.match(/^\/api\/oauth\/session\/([^\/]+)$/);
    if (sessionStatusMatch && sessionStatusMatch[1] && method === "GET") {
      return getOAuthSessionStatus(request, env, sessionStatusMatch[1]);
    }

    const userDataMatch = path.match(/^\/api\/oauth\/user\/([^\/]+)$/);
    if (userDataMatch && userDataMatch[1] && method === "GET") {
      return getUserData(request, env, userDataMatch[1]);
    }

    if (path === "/api/oauth/approve" && method === "POST") {
      return approveOAuthSession(request, env);
    }

    if (path === "/api/oauth/cancel" && method === "POST") {
      return cancelOAuthSession(request, env);
    }

    return errorResponse("Endpoint não encontrado", 404);
  },
};
