export const SETTINGS_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Configurações - Epístola Auth</title>
  <script>
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  </script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <script>
    tailwind.config = {
      darkMode: 'class'
    }
  </script>
</head>
<body class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>

  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <a href="/dashboard" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">&larr; Voltar ao Dashboard</a>
    </div>

    <h1 class="text-3xl font-bold mb-6">Configurações de Perfil</h1>

    <div id="successMessage" class="hidden mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400"></div>
    <div id="errorMessage" class="hidden mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"></div>

    <div class="space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold mb-4">Informações Pessoais</h2>
        <form id="nameForm" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium mb-1">Nome</label>
            <input id="name" type="text" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input id="email" type="email" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 text-sm" readonly />
            <button type="button" onclick="showEmailChangeModal()" class="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">Alterar e-mail</button>
          </div>
          <button type="submit" class="h-9 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
            Salvar Nome
          </button>
        </form>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold mb-4">Alterar Senha</h2>
        <form id="passwordForm" class="space-y-4">
          <div>
            <label for="currentPassword" class="block text-sm font-medium mb-1">Senha Atual</label>
            <input id="currentPassword" type="password" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          </div>
          <div>
            <label for="newPassword" class="block text-sm font-medium mb-1">Nova Senha</label>
            <input id="newPassword" type="password" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          </div>
          <button type="submit" class="h-9 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
            Alterar Senha
          </button>
        </form>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-xl font-semibold mb-4">Autenticação de Dois Fatores (2FA)</h2>
        <div id="2faStatus">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Carregando...</p>
        </div>
      </div>
    </div>
  </div>

  <div id="emailChangeModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
      <h3 class="text-lg font-semibold mb-4">Alterar Email</h3>
      <form id="emailChangeForm" class="space-y-4">
        <div>
          <label for="newEmail" class="block text-sm font-medium mb-1">Novo Email</label>
          <input id="newEmail" type="email" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Você receberá um link de confirmação no novo e-mail</p>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Enviar</button>
          <button type="button" onclick="hideEmailChangeModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <div id="enable2FAModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
      <h3 class="text-lg font-semibold mb-4">Ativar Autenticação por App</h3>
      
      <!-- Etapa 1: Verificar Email -->
      <div id="step1" class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Etapa 1 de 3: Verificar seu e-mail</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Enviamos um código de 6 dígitos para seu e-mail. Insira o código abaixo:</p>
        <div>
          <label for="emailCode2FA" class="block text-sm font-medium mb-1">Código do e-mail</label>
          <input id="emailCode2FA" type="text" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" maxlength="6" />
        </div>
        <div class="flex gap-2">
          <button onclick="verifyEmailStep()" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Verificar</button>
          <button onclick="hideEnable2FAModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </div>

      <!-- Etapa 2: QR Code e App -->
      <div id="step2" class="hidden space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Etapa 2 de 3: Configurar app autenticador</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Escaneie o QR code com seu app de autenticação (Google Authenticator, Authy, etc.):</p>
        <div id="qrCodeContainer" class="flex justify-center p-4"></div>
        <button onclick="toggleSecretView()" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">Não consegue escanear? Clique para ver o código</button>
        <div id="secretCodeContainer" class="hidden p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Insira este código manualmente no app:</p>
          <code id="secretCodeText" class="text-sm font-mono break-all"></code>
        </div>
        <div>
          <label for="appCode2FA" class="block text-sm font-medium mb-1">Código do app (6 dígitos)</label>
          <input id="appCode2FA" type="text" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" maxlength="6" />
        </div>
        <div id="turnstileContainer" class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY" data-theme="auto" data-size="normal"></div>
        <div class="flex gap-2">
          <button onclick="verifyAppStep()" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Verificar</button>
          <button onclick="hideEnable2FAModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </div>

      <!-- Etapa 3: Códigos de Backup -->
      <div id="step3" class="hidden space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Etapa 3 de 3: Salvar códigos de recuperação</p>
        <p class="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
          </svg>
          Importante: Guarde estes códigos em local seguro!
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400">Você precisará deles se perder acesso ao seu app autenticador.</p>
        <div id="backupCodesContainer" class="p-3 bg-gray-100 dark:bg-gray-700 rounded-md font-mono text-xs max-h-48 overflow-y-auto"></div>
        <button onclick="downloadBackupCodes()" class="w-full h-9 bg-green-600 dark:bg-green-500 text-white rounded-md text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Baixar códigos de recuperação
        </button>
        <p id="downloadWarning" class="text-xs text-gray-500 dark:text-gray-400 italic">Você deve baixar os códigos para ativar o 2FA</p>
        <button id="activateBtn" disabled onclick="activateTOTP()" class="w-full h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed">
          Ativar 2FA
        </button>
      </div>
    </div>
  </div>

  <div id="disable2FAModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
      <h3 class="text-lg font-semibold mb-4">Desativar Autenticação por App</h3>
      <div class="space-y-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">Para desativar, insira:</p>
        <div>
          <label for="emailCodeDisable" class="block text-sm font-medium mb-1">Código do e-mail </label>
          <input id="emailCodeDisable" type="text" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" maxlength="6" />
        </div>
        <div>
          <label for="appCodeDisable" class="block text-sm font-medium mb-1">Código do app ou backup</label>
          <input id="appCodeDisable" type="text" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" />
        </div>
        <div class="flex gap-2">
          <button onclick="submitDisable2FA()" class="flex-1 h-9 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600">Desativar</button>
          <button onclick="hideDisable2FAModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let setupData = null;

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

    function showSuccess(msg) {
      const el = document.getElementById('successMessage');
      el.textContent = msg;
      el.classList.remove('hidden');
      document.getElementById('errorMessage').classList.add('hidden');
      setTimeout(() => el.classList.add('hidden'), 5000);
    }

    function showError(msg) {
      const el = document.getElementById('errorMessage');
      el.textContent = msg;
      el.classList.remove('hidden');
      document.getElementById('successMessage').classList.add('hidden');
    }

    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/profile');
        if (!res.ok) throw new Error('Não autenticado');
        const data = await res.json();
        document.getElementById('name').value = data.name;
        document.getElementById('email').value = data.email;
        
        update2FAStatus(data.totp_enabled);
      } catch (err) {
        window.location.href = '/login';
      }
    }

    function update2FAStatus(enabled) {
      const container = document.getElementById('2faStatus');
      if (enabled) {
        container.innerHTML = \`
          <p class="text-sm text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            Autenticação por app ativada
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Você sempre receberá códigos por e-mail como opção alternativa</p>
          <button onclick="showDisable2FAModal()" class="h-9 px-4 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600">
            Desativar App Authenticator
          </button>
        \`;
      } else {
        container.innerHTML = \`
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Você recebe códigos por e-mail. Ative a autenticação por app para mais segurança.</p>
          <button onclick="showEnable2FAModal()" class="h-9 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
            Ativar App Authenticator
          </button>
        \`;
      }
    }

    document.getElementById('nameForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/profile/name', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: document.getElementById('name').value })
        });
        const data = await res.json();
        if (res.ok) {
          showSuccess('Nome atualizado com sucesso!');
        } else {
          showError(data.error || 'Erro ao atualizar nome');
        }
      } catch (err) {
        showError('Erro ao atualizar nome');
      }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_password: document.getElementById('currentPassword').value,
            new_password: document.getElementById('newPassword').value
          })
        });
        const data = await res.json();
        if (res.ok) {
          showSuccess('Senha alterada com sucesso!');
          document.getElementById('passwordForm').reset();
        } else {
          showError(data.error || 'Erro ao alterar senha');
        }
      } catch (err) {
        showError('Erro ao alterar senha');
      }
    });

    function showEmailChangeModal() {
      document.getElementById('emailChangeModal').classList.remove('hidden');
    }

    function hideEmailChangeModal() {
      document.getElementById('emailChangeModal').classList.add('hidden');
      document.getElementById('emailChangeForm').reset();
    }

    document.getElementById('emailChangeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch('/api/profile/email/change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_email: document.getElementById('newEmail').value })
        });
        const data = await res.json();
        if (res.ok) {
          hideEmailChangeModal();
          showSuccess('Link de confirmação enviado para o novo e-mail !');
        } else {
          showError(data.error || 'Erro ao solicitar alteração de e-mail ');
        }
      } catch (err) {
        showError('Erro ao solicitar alteração de e-mail ');
      }
    });

    async function showEnable2FAModal() {
      try {
        const sendRes = await fetch('/api/profile/2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'enable_totp' })
        });
        if (!sendRes.ok) throw new Error('Erro ao enviar código');

        const setupRes = await fetch('/api/profile/2fa/setup', { method: 'POST' });
        const data = await setupRes.json();
        if (!setupRes.ok) throw new Error(data.error);

        setupData = data;
        
        document.getElementById('qrCodeContainer').innerHTML = \`<img src="\${data.qrCode}" alt="QR Code" class="w-48 h-48" />\`;
        document.getElementById('secretCodeText').textContent = data.secret;
        document.getElementById('backupCodesContainer').textContent = data.backupCodes.join('\\n');
        
        document.getElementById('step1').classList.remove('hidden');
        document.getElementById('step2').classList.add('hidden');
        document.getElementById('step3').classList.add('hidden');
        document.getElementById('enable2FAModal').classList.remove('hidden');
      } catch (err) {
        showError('Erro ao iniciar configuração 2FA');
      }
    }

    function hideEnable2FAModal() {
      document.getElementById('enable2FAModal').classList.add('hidden');
      document.getElementById('step1').classList.remove('hidden');
      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.add('hidden');
      document.getElementById('emailCode2FA').value = '';
      document.getElementById('appCode2FA').value = '';
      document.getElementById('secretCodeContainer').classList.add('hidden');
      document.getElementById('activateBtn').disabled = true;
      setupData = null;
    }

    document.getElementById('emailCode2FA').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length === 6 && /^\\d{6}$/.test(value)) {
        verifyEmailStep();
      }
    });

    document.getElementById('appCode2FA').addEventListener('input', (e) => {
      const value = e.target.value;
      if (value.length === 6 && /^\\d{6}$/.test(value)) {
        verifyAppStep();
      }
    });

    function toggleSecretView() {
      document.getElementById('secretCodeContainer').classList.toggle('hidden');
    }

    async function verifyEmailStep() {
      const emailCode = document.getElementById('emailCode2FA').value;
      if (!emailCode || emailCode.length !== 6) {
        showError('Insira o código de 6 dígitos do e-mail');
        return;
      }

      document.getElementById('step1').classList.add('hidden');
      document.getElementById('step2').classList.remove('hidden');
    }

    async function verifyAppStep() {
      const appCode = document.getElementById('appCode2FA').value;
      if (!appCode || appCode.length !== 6) {
        showError('Insira o código de 6 dígitos do app');
        return;
      }

      const turnstileToken = turnstile.getResponse();
      if (!turnstileToken) {
        showError('Complete a verificação de segurança');
        return;
      }

      document.getElementById('step2').classList.add('hidden');
      document.getElementById('step3').classList.remove('hidden');
    }

    function downloadBackupCodes() {
      if (!setupData || !setupData.backupCodes) return;

      const content = 'Códigos de Recuperação - Epístola Auth\\n\\n' + 
                     setupData.backupCodes.join('\\n') + 
                     '\\n\\nGuarde estes códigos em local seguro!';
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'epistola-backup-codes.txt';
      a.click();
      URL.revokeObjectURL(url);

      document.getElementById('activateBtn').disabled = false;
      document.getElementById('downloadWarning').innerHTML = '<svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> Códigos baixados! Agora você pode ativar o 2FA.';
    }

    async function activateTOTP() {
      const emailCode = document.getElementById('emailCode2FA').value;
      const appCode = document.getElementById('appCode2FA').value;
      const turnstileToken = turnstile.getResponse();

      try {
        const res = await fetch('/api/profile/2fa/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailCode: emailCode,
            totpCode: appCode,
            backupCodes: setupData.backupCodes,
            turnstileToken: turnstileToken
          })
        });
        const data = await res.json();
        if (res.ok) {
          hideEnable2FAModal();
          showSuccess('Autenticação por app ativada com sucesso!');
          update2FAStatus(true);
        } else {
          showError(data.error || 'Erro ao ativar 2FA');
        }
      } catch (err) {
        showError('Erro ao ativar 2FA');
      }
    }

    async function showDisable2FAModal() {
      try {
        const res = await fetch('/api/profile/2fa/send-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purpose: 'disable_totp' })
        });
        if (!res.ok) throw new Error('Erro ao enviar código');
        
        document.getElementById('disable2FAModal').classList.remove('hidden');
      } catch (err) {
        showError('Erro ao iniciar desativação 2FA');
      }
    }

    function hideDisable2FAModal() {
      document.getElementById('disable2FAModal').classList.add('hidden');
      document.getElementById('emailCodeDisable').value = '';
      document.getElementById('appCodeDisable').value = '';
    }

    document.getElementById('emailCodeDisable').addEventListener('input', (e) => {
      const emailValue = e.target.value;
      const appValue = document.getElementById('appCodeDisable').value;
      if (emailValue.length === 6 && /^\\d{6}$/.test(emailValue) && appValue.length === 6 && /^\\d{6}$/.test(appValue)) {
        submitDisable2FA();
      }
    });

    document.getElementById('appCodeDisable').addEventListener('input', (e) => {
      const appValue = e.target.value;
      const emailValue = document.getElementById('emailCodeDisable').value;
      if (appValue.length === 6 && /^\\d{6}$/.test(appValue) && emailValue.length === 6 && /^\\d{6}$/.test(emailValue)) {
        submitDisable2FA();
      }
    });

    async function submitDisable2FA() {
      const emailCode = document.getElementById('emailCodeDisable').value;
      const appCode = document.getElementById('appCodeDisable').value;
      
      if (!emailCode || !appCode) {
        showError('Preencha todos os códigos');
        return;
      }

      try {
        const res = await fetch('/api/profile/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailCode: emailCode,
            appCode: appCode
          })
        });
        const data = await res.json();
        if (res.ok) {
          hideDisable2FAModal();
          showSuccess('Autenticação por app desativada');
          update2FAStatus(false);
        } else {
          showError(data.error || 'Erro ao desativar 2FA');
        }
      } catch (err) {
        showError('Erro ao desativar 2FA');
      }
    }

    updateThemeIcon();
    loadProfile();
  </script>
</body>
</html>`;
