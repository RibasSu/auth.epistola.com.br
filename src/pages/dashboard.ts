export const DASHBOARD_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard - Epístola Auth</title>
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
<body class="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
  <button onclick="toggleTheme()" class="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors z-50" aria-label="Alternar tema">
    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
    </svg>
    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path>
    </svg>
  </button>
  
  <div class="max-w-7xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <div class="flex items-center gap-4">
        <a href="/settings" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          Configurações
        </a>
        <button onclick="logout()" class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          Sair
        </button>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="font-semibold mb-2">Perfil</h3>
        <p class="text-sm text-gray-900 dark:text-gray-100" id="userName">Carregando...</p>
        <p class="text-sm text-gray-600 dark:text-gray-400" id="userEmail"></p>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold">Meus Epistolários</h2>
        <button onclick="showCreateModal()" class="inline-flex items-center justify-center h-9 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Criar Epistolário
        </button>
      </div>
      <div id="epistolariesList" class="grid gap-3"></div>
    </div>
  </div>

  <!-- Sistema de Notificações -->
  <div id="toastContainer" class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"></div>

  <!-- Modal Criar Epistolário -->
  <div id="createModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-semibold mb-4">Criar Epistolário</h3>
      <form id="createForm" class="grid gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nome *</label>
          <input id="epName" type="text" placeholder="Meu Aplicativo" class="h-9 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">URL de Callback *</label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">https://</span>
            <input id="epRedirect" type="text" placeholder="app.muie.com.br/callback" class="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">URL para onde o usuário será redirecionado após autorização (apenas HTTPS)</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Descrição</label>
          <textarea id="epDesc" placeholder="Descreva seu aplicativo" class="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm" rows="3"></textarea>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Criar</button>
          <button type="button" onclick="hideCreateModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Detalhes -->
  <div id="detailsModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <div class="flex items-center gap-2">
          <h3 id="detailsName" class="text-lg font-semibold"></h3>
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
        <button onclick="hideDetailsModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <label class="block text-sm font-medium mb-2">Client ID</label>
          <div class="flex gap-2">
            <input id="detailsClientId" type="text" readonly class="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm font-mono" />
            <button onclick="copyToClipboard('detailsClientId', this)" class="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div class="flex items-start gap-2 mb-2">
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">Client Secret (mantenha seguro!)</p>
              <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">Nunca compartilhe ou exponha este secret no frontend</p>
            </div>
          </div>
          <div class="flex gap-2">
            <input id="detailsClientSecret" type="password" readonly class="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm font-mono" />
            <button onclick="toggleSecret()" class="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg id="eyeIcon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </button>
            <button onclick="copyToClipboard('detailsClientSecret', this)" class="h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
            <button onclick="regenerateSecret()" class="h-9 px-3 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm hover:bg-red-700 dark:hover:bg-red-600">
              Regenerar
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Descrição</label>
          <p id="detailsDescription" class="text-sm text-gray-600 dark:text-gray-400"></p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">URLs de Callback</label>
          <div id="detailsRedirectUris" class="space-y-2"></div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Status</label>
          <div class="flex items-center gap-2">
            <span id="detailsStatus" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"></span>
          </div>
        </div>

        <div class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button onclick="showEditModal()" class="w-full h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">
            Editar URL de Callback
          </button>
          <button onclick="showDeleteModal()" class="w-full h-9 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600">
            Excluir Epistolário
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Editar Callback -->
  <div id="editModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full">
      <h3 class="text-lg font-semibold mb-4">Editar URL de Callback</h3>
      <form id="editForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Nova URL de Callback *</label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-gray-400 font-mono">https://</span>
            <input id="editRedirect" type="text" placeholder="app.muie.com.br/callback" class="flex-1 h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Apenas HTTPS é permitido</p>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Salvar</button>
          <button type="button" onclick="hideEditModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal Excluir -->
  <div id="deleteModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg w-full">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <h3 class="text-lg font-semibold text-red-600 dark:text-red-400">Excluir Epistolário</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Esta é uma ação irreversível. Para confirmar, siga os passos:</p>
      <form id="deleteForm" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Digite exatamente: <span class="font-mono text-red-600 dark:text-red-400" id="deleteConfirmText" style="user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;-webkit-user-drag:none;user-drag:none;pointer-events:none;"></span></label>
          <input id="deleteConfirmInput" type="text" class="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Confirme sua senha *</label>
          <input id="deletePassword" type="password" class="w-full h-9 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-sm" required />
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
          </svg>
          <p class="text-xs text-amber-800 dark:text-amber-200">Após esta etapa, você receberá um link de confirmação final por e-mail.</p>
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-9 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600">Continuar</button>
          <button type="button" onclick="hideDeleteModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Modal 2FA -->
  <div id="twoFAModal" class="hidden fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clip-rule="evenodd"></path>
        </svg>
        <h3 class="text-lg font-semibold">Autenticação de Dois Fatores</h3>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Digite o código de 6 dígitos do seu aplicativo autenticador:</p>
      <form id="twoFAForm" class="space-y-4">
        <div>
          <input id="twoFACode" type="text" maxlength="6" pattern="[0-9]{6}" class="w-full h-12 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1 text-xl text-center font-mono tracking-widest" placeholder="000000" required autofocus />
        </div>
        <div class="flex gap-2">
          <button type="submit" class="flex-1 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600">Confirmar</button>
          <button type="button" onclick="hideTwoFAModal()" class="flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let currentEpistolary = null;

    function showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = 'pointer-events-auto transform transition-all duration-300 translate-x-0 opacity-100';
      
      const colors = {
        success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
        warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
      };
      
      const icons = {
        success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
        error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
        warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
        info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
      };
      
      toast.innerHTML = \`
        <div class="flex items-start gap-3 \${colors[type]} border rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-md">
          <div class="flex-shrink-0">\${icons[type]}</div>
          <p class="text-sm font-medium flex-1">\${message}</p>
          <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 hover:opacity-70">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
          </button>
        </div>
      \`;
      
      container.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
      }, 5000);
    }

    function showConfirm(message, onConfirm) {
      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]';
      overlay.innerHTML = \`
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
          <h3 class="text-lg font-semibold mb-3">Confirmação</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">\${message}</p>
          <div class="flex gap-2">
            <button class="confirm-yes flex-1 h-9 bg-red-600 dark:bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600">Confirmar</button>
            <button class="confirm-no flex-1 h-9 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Cancelar</button>
          </div>
        </div>
      \`;
      
      document.body.appendChild(overlay);
      
      overlay.querySelector('.confirm-yes').addEventListener('click', () => {
        overlay.remove();
        onConfirm();
      });
      
      overlay.querySelector('.confirm-no').addEventListener('click', () => {
        overlay.remove();
      });
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
      });
    }

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
    if (urlParams.get('deleted') === 'true') {
      showToast('Epistolário excluído com sucesso!', 'success');
      window.history.replaceState({}, '', '/dashboard');
    }

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
        } else if (data.email_verified === 0) {
          window.location.href = '/verify-pending';
        }
      })
      .catch(() => {
        window.location.href = '/';
      });

    async function loadProfile() {
      const res = await fetch('/api/auth/profile');
      const data = await res.json();
      if (res.ok && data.name) {
        document.getElementById('userName').textContent = data.name;
        document.getElementById('userEmail').textContent = data.email;
      }
    }

    async function loadEpistolaries() {
      const res = await fetch('/api/epistolaries');
      const data = await res.json();
      const list = document.getElementById('epistolariesList');
      
      if (data.success && data.epistolaries.length > 0) {
        list.innerHTML = data.epistolaries.map(ep => {
          const status = ep.active ? 'Ativo' : 'Inativo';
          const statusColor = ep.active ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
          
          let badges = '';
          if (ep.is_verified) {
            badges += \`<svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20" title="Verificado">
              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>\`;
          }
          if (ep.is_official) {
            badges += \`<svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20" title="Oficial">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>\`;
          }

          return \`
            <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors" onclick='showDetails(\${JSON.stringify(ep)})'>
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-medium">\${ep.name}</h4>
                    \${badges}
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400">\${ep.description || 'Sem descrição'}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">ID: \${ep.client_id}</p>
                </div>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${statusColor}">
                  \${status}
                </span>
              </div>
            </div>
          \`;
        }).join('');
      } else {
        list.innerHTML = \`
          <div class="text-center py-12 text-gray-500 dark:text-gray-400">
            <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
            </svg>
            <p class="text-sm">Nenhum epistolário criado ainda</p>
            <p class="text-xs mt-2">Crie seu primeiro epistolário para começar a integrar com nossa API OAuth</p>
          </div>
        \`;
      }
    }

    function showCreateModal() {
      document.getElementById('createModal').classList.remove('hidden');
    }

    function hideCreateModal() {
      document.getElementById('createModal').classList.add('hidden');
      document.getElementById('createForm').reset();
    }

    async function showDetails(epistolary) {
      currentEpistolary = epistolary;
      
      const res = await fetch(\`/api/epistolaries/\${epistolary.id}\`, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        showToast('Erro ao carregar detalhes do epistolário', 'error');
        return;
      }
      
      const data = await res.json();
      const fullEpistolary = data.epistolary;
      currentEpistolary = fullEpistolary;
      
      document.getElementById('detailsName').textContent = fullEpistolary.name;
      document.getElementById('detailsClientId').value = fullEpistolary.client_id;
      document.getElementById('detailsClientSecret').value = fullEpistolary.client_secret;
      document.getElementById('detailsClientSecret').type = 'password';
      document.getElementById('detailsDescription').textContent = fullEpistolary.description || 'Sem descrição';
      
      const uris = Array.isArray(fullEpistolary.redirect_uris) ? fullEpistolary.redirect_uris : JSON.parse(fullEpistolary.redirect_uris);
      document.getElementById('detailsRedirectUris').innerHTML = uris.map(uri => 
        \`<div class="text-sm bg-gray-50 dark:bg-gray-700 rounded p-2 font-mono">\${uri}</div>\`
      ).join('');

      const statusEl = document.getElementById('detailsStatus');
      if (fullEpistolary.active) {
        statusEl.textContent = 'Ativo';
        statusEl.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      } else {
        statusEl.textContent = 'Inativo';
        statusEl.className = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
      }

      if (fullEpistolary.is_verified) {
        document.getElementById('verifiedBadge').classList.remove('hidden');
      } else {
        document.getElementById('verifiedBadge').classList.add('hidden');
      }

      if (fullEpistolary.is_official) {
        document.getElementById('officialBadge').classList.remove('hidden');
      } else {
        document.getElementById('officialBadge').classList.add('hidden');
      }

      document.getElementById('detailsModal').classList.remove('hidden');
    }

    function hideDetailsModal() {
      document.getElementById('detailsModal').classList.add('hidden');
      currentEpistolary = null;
    }

    function toggleSecret() {
      const input = document.getElementById('detailsClientSecret');
      input.type = input.type === 'password' ? 'text' : 'password';
    }

    async function copyToClipboard(elementId, button) {
      const input = document.getElementById(elementId);
      if (!input || !button) return;
      
      await navigator.clipboard.writeText(input.value);
      
      const originalHTML = button.innerHTML;
      button.innerHTML = '<svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      setTimeout(() => button.innerHTML = originalHTML, 2000);
    }

    async function regenerateSecret() {
      showConfirm('Tem certeza que deseja regenerar o Client Secret? O secret atual será invalidado e todas as integrações existentes pararão de funcionar.', async () => {
        const res = await fetch(\`/api/epistolaries/\${currentEpistolary.id}/regenerate\`, {
          method: 'POST',
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          currentEpistolary.client_secret = data.client_secret;
          document.getElementById('detailsClientSecret').value = data.client_secret;
          showToast('Client Secret regenerado com sucesso!', 'success');
        } else {
          showToast('Erro ao regenerar Client Secret', 'error');
        }
      });
    }

    function showEditModal() {
      const currentUri = Array.isArray(currentEpistolary.redirect_uris) 
        ? currentEpistolary.redirect_uris[0] 
        : JSON.parse(currentEpistolary.redirect_uris)[0];
      
      const uriWithoutHttps = currentUri.replace('https://', '');
      document.getElementById('editRedirect').value = uriWithoutHttps;
      document.getElementById('editModal').classList.remove('hidden');
    }

    function hideEditModal() {
      document.getElementById('editModal').classList.add('hidden');
      document.getElementById('editForm').reset();
    }

    async function showDeleteModal() {
      document.getElementById('deleteConfirmText').textContent = \`Eu confirmo a exclusão de \${currentEpistolary.name}\`;
      document.getElementById('deleteModal').classList.remove('hidden');
    }

    function hideDeleteModal() {
      document.getElementById('deleteModal').classList.add('hidden');
      document.getElementById('deleteForm').reset();
    }

    function showTwoFAModal() {
      document.getElementById('twoFAModal').classList.remove('hidden');
      setTimeout(() => document.getElementById('twoFACode').focus(), 100);
    }

    function hideTwoFAModal() {
      document.getElementById('twoFAModal').classList.add('hidden');
      document.getElementById('twoFAForm').reset();
    }

    let deletePendingData = null;

    document.getElementById('editForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const redirectValue = document.getElementById('editRedirect').value.trim();
      
      if (redirectValue.startsWith('http://')) {
        showToast('Apenas URLs HTTPS são permitidas por questões de segurança', 'warning');
        return;
      }
      
      const fullUrl = redirectValue.startsWith('https://') ? redirectValue : 'https://' + redirectValue;
      
      const res = await fetch(\`/api/epistolaries/\${currentEpistolary.id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirect_uris: [fullUrl]
        }),
        credentials: 'include'
      });
      
      if (res.ok) {
        currentEpistolary.redirect_uris = [fullUrl];
        document.getElementById('detailsRedirectUris').innerHTML = 
          \`<div class="text-sm bg-gray-50 dark:bg-gray-700 rounded p-2 font-mono">\${fullUrl}</div>\`;
        hideEditModal();
        showToast('URL de callback atualizada com sucesso!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao atualizar URL', 'error');
      }
    });

    document.getElementById('deleteForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const confirmText = \`Eu confirmo a exclusão de \${currentEpistolary.name}\`;
      const inputText = document.getElementById('deleteConfirmInput').value;
      
      if (inputText !== confirmText) {
        showToast('O texto de confirmação não corresponde. Digite exatamente como mostrado.', 'error');
        return;
      }
      
      const password = document.getElementById('deletePassword').value;
      deletePendingData = { password };
      
      const profileRes = await fetch('/api/auth/profile');
      const profile = await profileRes.json();
      
      if (profile.totp_enabled) {
        hideDeleteModal();
        showTwoFAModal();
      } else {
        await sendDeleteRequest(password);
      }
    });

    document.getElementById('twoFAForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const twoFACode = document.getElementById('twoFACode').value;
      
      if (!deletePendingData) {
        showToast('Erro: dados de exclusão não encontrados', 'error');
        return;
      }
      
      await sendDeleteRequest(deletePendingData.password, twoFACode);
      hideTwoFAModal();
    });

    async function sendDeleteRequest(password, twoFACode) {
      const res = await fetch(\`/api/epistolaries/\${currentEpistolary.id}/request-delete\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: password,
          twofa_code: twoFACode || undefined
        }),
        credentials: 'include'
      });
      
      if (res.ok) {
        hideDetailsModal();
        deletePendingData = null;
        showToast('Link de confirmação enviado para seu e-mail. Verifique sua caixa de entrada para concluir a exclusão.', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao solicitar exclusão', 'error');
      }
    }

    document.getElementById('createForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const redirectValue = document.getElementById('epRedirect').value.trim();
      
      if (redirectValue.startsWith('http://')) {
        showToast('Apenas URLs HTTPS são permitidas por questões de segurança', 'warning');
        return;
      }
      
      const fullUrl = redirectValue.startsWith('https://') ? redirectValue : 'https://' + redirectValue;
      
      const res = await fetch('/api/epistolaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: document.getElementById('epName').value,
          redirect_uris: [fullUrl],
          description: document.getElementById('epDesc').value
        }),
        credentials: 'include'
      });
      
      if (res.ok) {
        hideCreateModal();
        loadEpistolaries();
        showToast('Epistolário criado com sucesso!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao criar epistolário', 'error');
      }
    });

    async function logout() {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    }

    loadProfile();
    loadEpistolaries();
  </script>
</body>
</html>`;
