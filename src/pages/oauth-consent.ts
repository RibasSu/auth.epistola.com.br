export const OAUTH_CONSENT_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Autorizar Acesso - Epístola Auth</title>
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

  <div id="loading" class="text-center">
    <svg class="w-12 h-12 animate-spin text-blue-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
    </svg>
    <p class="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
  </div>

  <div id="notLoggedIn" class="hidden w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm text-center">
      <div class="flex justify-center mb-4">
        <svg class="w-16 h-16 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <h1 class="text-2xl font-semibold mb-2">Login Necessário</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Você precisa estar logado para autorizar o acesso a <span id="appName1" class="font-semibold"></span>
      </p>
      <div class="space-y-3">
        <a href="/login" class="block w-full h-10 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center">
          Fazer Login
        </a>
        <a href="/register" class="block w-full h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center">
          Criar Conta
        </a>
      </div>
    </div>
  </div>

  <div id="consent" class="hidden w-full max-w-md">
    <div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div class="flex items-start gap-4 mb-6">
        <img id="appLogo" src="" alt="Logo" class="w-16 h-16 rounded-lg hidden" onerror="this.style.display='none'">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h1 id="appName" class="text-xl font-semibold"></h1>
            <span id="verifiedBadge" class="hidden">
              <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </span>
            <span id="officialBadge" class="hidden">
              <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            </span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            deseja acessar sua conta
          </p>
        </div>
      </div>

      <div id="userMismatchWarning" class="hidden mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div class="flex items-start gap-2">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          <div class="text-sm text-amber-800 dark:text-amber-200">
            <p class="font-semibold mb-1">Este login é específico</p>
            <p>Você está logado como <span id="currentUser" class="font-mono"></span>, mas este aplicativo solicitou acesso para <span id="targetUser" class="font-mono"></span>. Você não poderá prosseguir.</p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="text-sm font-semibold mb-3">Permissões solicitadas:</h2>
        <div id="permissions" class="space-y-2"></div>
      </div>

      <div id="error" class="hidden mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"></div>

      <div class="flex gap-3">
        <button id="cancelBtn" onclick="cancelAuth()" class="flex-1 h-10 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancelar
        </button>
        <button id="approveBtn" onclick="approveAuth()" class="flex-1 h-10 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
          Autorizar
        </button>
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
    const sessionToken = urlParams.get('session');
    let sessionData = null;

    if (!sessionToken) {
      document.getElementById('loading').innerHTML = '<p class="text-red-600 dark:text-red-400">Sessão inválida</p>';
    } else {
      loadSession();
    }

    async function loadSession() {
      try {
        const res = await fetch(\`/api/oauth/authorize?session=\${sessionToken}\`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao carregar sessão');
        }

        sessionData = data;

        document.getElementById('loading').classList.add('hidden');

        if (!data.is_logged_in) {
          document.getElementById('appName1').textContent = data.epistolary.name;
          document.getElementById('notLoggedIn').classList.remove('hidden');
          return;
        }

        document.getElementById('appName').textContent = data.epistolary.name;
        
        if (data.epistolary.logo_url) {
          const logo = document.getElementById('appLogo');
          logo.src = data.epistolary.logo_url;
          logo.classList.remove('hidden');
        }

        if (data.epistolary.is_verified) {
          document.getElementById('verifiedBadge').classList.remove('hidden');
        }

        if (data.epistolary.is_official) {
          document.getElementById('officialBadge').classList.remove('hidden');
        }

        if (data.target_user !== 'all' && data.user.email !== data.target_user) {
          document.getElementById('currentUser').textContent = data.user.email;
          document.getElementById('targetUser').textContent = data.target_user;
          document.getElementById('userMismatchWarning').classList.remove('hidden');
          document.getElementById('approveBtn').disabled = true;
          document.getElementById('approveBtn').classList.add('opacity-50', 'cursor-not-allowed');
        }

        const permissionsContainer = document.getElementById('permissions');
        data.permissions.forEach(perm => {
          const div = document.createElement('div');
          div.className = 'flex items-start gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700';
          
          let icon = '';
          if (perm.is_critical === 1) {
            icon = \`
              <div class="relative group">
                <svg class="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <div class="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded p-2 w-48 z-10">
                  \${perm.description}
                </div>
              </div>
            \`;
          } else {
            icon = \`
              <svg class="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
            \`;
          }
          
          div.innerHTML = \`
            \${icon}
            <div class="flex-1">
              <p class="text-sm font-medium">\${perm.name}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">\${perm.description}</p>
            </div>
          \`;
          permissionsContainer.appendChild(div);
        });

        document.getElementById('consent').classList.remove('hidden');
      } catch (err) {
        document.getElementById('loading').innerHTML = \`<p class="text-red-600 dark:text-red-400">\${err.message}</p>\`;
      }
    }

    async function approveAuth() {
      const btn = document.getElementById('approveBtn');
      btn.disabled = true;
      btn.textContent = 'Autorizando...';

      try {
        const res = await fetch('/api/oauth/approve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken }),
          credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao autorizar');
        }

        window.location.href = data.redirect_url;
      } catch (err) {
        const error = document.getElementById('error');
        error.textContent = err.message;
        error.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Autorizar';
      }
    }

    async function cancelAuth() {
      const btn = document.getElementById('cancelBtn');
      btn.disabled = true;
      btn.textContent = 'Cancelando...';

      try {
        const res = await fetch('/api/oauth/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_token: sessionToken })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao cancelar');
        }

        window.location.href = data.redirect_url;
      } catch (err) {
        const error = document.getElementById('error');
        error.textContent = err.message;
        error.classList.remove('hidden');
        btn.disabled = false;
        btn.textContent = 'Cancelar';
      }
    }
  </script>
</body>
</html>`;
