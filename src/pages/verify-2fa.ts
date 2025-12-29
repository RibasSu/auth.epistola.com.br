export const VERIFY_2FA_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificação 2FA - Epístola Auth</title>
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
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex flex-col gap-6 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div class="text-center">
        <div class="text-4xl mb-4 flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4m-2 0h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z" />
        </svg>
      </div>
        <h1 class="text-2xl font-semibold">Verificação em Duas Etapas</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Escolha um método para verificar sua identidade</p>
      </div>

      <div id="methodSelection" class="grid gap-3">

      <button id="btnAppMethod" class="hidden p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left">
        <div class="flex items-center gap-2 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 17h.01" />
          </svg>
          Aplicativo Autenticador
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Use o código do seu app
        </div>
      </button>

      <button id="btnEmailMethod" class="hidden p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left">
        <div class="flex items-center gap-2 font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l9 6 9-6" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 8v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8" />
          </svg>
          Código por Email
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-400">
          Receba um código no seu e-mail
        </div>
      </button>

    </div>

      <form id="verifyForm" class="hidden grid gap-4">
        <div class="text-center mb-2">
          <button type="button" onclick="backToMethods()" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Voltar aos métodos</button>
        </div>
        
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="code">Código de Verificação</label>
          <input 
            id="code" 
            type="text" 
            placeholder="000000"
            maxlength="8"
            class="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 text-center text-2xl tracking-widest font-mono shadow-sm transition-colors focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            required
          />
        </div>

        <div id="emailCodeBtn" class="hidden">
          <button type="button" onclick="sendEmailCode()" id="btnSendCode" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            Enviar código para e-mail 
          </button>
        </div>

        <div id="error" class="hidden text-sm text-red-600 dark:text-red-400"></div>
        
        <button 
          type="submit"
          class="inline-flex items-center justify-center h-9 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Verificar
        </button>
      </form>
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

    let currentMethod = null;
    let methods = { app: false, email: false };

    fetch('/api/auth/profile')
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
        } else {
          methods.app = data.totp_enabled === 1;
          methods.email = data.two_factor_email_enabled === 1;
          if (methods.app) document.getElementById('btnAppMethod').classList.remove('hidden');
          if (methods.email) document.getElementById('btnEmailMethod').classList.remove('hidden');
        }
      })
      .catch(() => window.location.href = '/');

    document.getElementById('btnAppMethod').addEventListener('click', () => {
      currentMethod = 'app';
      showVerifyForm();
    });

    document.getElementById('btnEmailMethod').addEventListener('click', () => {
      currentMethod = 'email';
      document.getElementById('emailCodeBtn').classList.remove('hidden');
      showVerifyForm();
    });

    function showVerifyForm() {
      document.getElementById('methodSelection').classList.add('hidden');
      document.getElementById('verifyForm').classList.remove('hidden');
      document.getElementById('code').focus();
    }

    function backToMethods() {
      document.getElementById('verifyForm').classList.add('hidden');
      document.getElementById('methodSelection').classList.remove('hidden');
      document.getElementById('code').value = '';
      document.getElementById('error').classList.add('hidden');
      document.getElementById('emailCodeBtn').classList.add('hidden');
      currentMethod = null;
    }

    async function sendEmailCode() {
      const btn = document.getElementById('btnSendCode');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      
      try {
        const res = await fetch('/api/auth/2fa/send-login-code', {
          method: 'POST',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
          btn.textContent = 'Código enviado!';
          setTimeout(() => {
            btn.textContent = 'Reenviar código';
            btn.disabled = false;
          }, 30000);
        } else {
          btn.textContent = originalText;
          btn.disabled = false;
          showError(data.error);
        }
      } catch (err) {
        btn.textContent = originalText;
        btn.disabled = false;
        showError('Erro ao enviar código');
      }
    }

    document.getElementById('code').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length === 6 && /^\\d{6}$/.test(value)) {
        document.getElementById('verifyForm').dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });

    document.getElementById('verifyForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('code').value;
      const error = document.getElementById('error');
      error.classList.add('hidden');
      
      try {
        const res = await fetch('/api/auth/2fa/verify-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, method: currentMethod }),
          credentials: 'include'
        });
        
        const data = await res.json();
        if (data.success) {
          window.location.href = '/dashboard';
        } else {
          showError(data.error);
        }
      } catch (err) {
        showError('Erro ao verificar código');
      }
    });

    function showError(message) {
      const error = document.getElementById('error');
      error.textContent = message;
      error.classList.remove('hidden');
    }
  </script>
</body>
</html>`;
