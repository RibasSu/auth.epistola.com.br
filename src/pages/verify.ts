const VERIFY_PENDING_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifique seu e-mail - Epístola Auth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 shadow-sm text-center">
      <div class="flex justify-center">
        <svg class="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
      </div>
      <div class="grid gap-2">
        <h1 class="text-2xl font-semibold">Verifique seu e-mail </h1>
        <p class="text-sm text-muted-foreground">Enviamos um link de verificação para seu e-mail . Clique no link para ativar sua conta.</p>
      </div>
      
      <div class="text-sm text-muted-foreground">
        Não recebeu o e-mail ? Verifique sua pasta de spam ou
        <a href="/resend-verification" class="text-primary hover:underline font-medium">reenvie o e-mail </a>
      </div>

      <div class="text-center text-sm pt-4 border-t">
        <a href="/" class="text-primary hover:underline font-medium">Voltar para login</a>
      </div>
    </div>
  </div>
</body>
</html>`;

const VERIFY_EMAIL_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verificando e-mail - Epístola Auth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 shadow-sm text-center">
      <div id="loading" class="flex justify-center">
        <svg class="w-16 h-16 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      </div>
      <div id="success" class="hidden flex justify-center">
        <svg class="w-16 h-16 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
      </div>
      <div id="error" class="hidden flex justify-center">
        <svg class="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
      </div>
      
      <div class="grid gap-2">
        <h1 id="title" class="text-2xl font-semibold">Verificando...</h1>
        <p id="message" class="text-sm text-muted-foreground"></p>
      </div>
    </div>
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      document.getElementById('loading').classList.add('hidden');
      document.getElementById('error').classList.remove('hidden');
      document.getElementById('title').textContent = 'Token inválido';
      document.getElementById('message').innerHTML = '<a href="/" class="text-primary hover:underline">Voltar para login</a>';
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
          document.getElementById('message').innerHTML = data.error + '<br><a href="/resend-verification" class="text-primary hover:underline">Reenviar e-mail </a>';
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

const RESEND_VERIFICATION_PAGE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reenviar verificação - Epístola Auth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border p-6 shadow-sm">
      <div class="grid gap-2">
        <h1 class="text-2xl font-semibold">Reenviar verificação</h1>
        <p class="text-sm text-muted-foreground">Digite seu e-mail para receber um novo link</p>
      </div>
      
      <form id="resendForm" class="grid gap-4">
        <div class="grid gap-2">
          <label class="text-sm font-medium" for="email">Email</label>
          <input 
            id="email" 
            type="email" 
            placeholder="maria@muie.com.br"
            class="h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            required
          />
        </div>
        
        <div id="error" class="hidden text-sm text-red-600"></div>
        <div id="success" class="hidden text-sm text-green-600"></div>
        
        <button 
          type="submit"
          class="inline-flex items-center justify-center h-9 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Reenviar e-mail 
        </button>
      </form>
      
      <div class="text-center text-sm">
        <a href="/" class="text-primary hover:underline font-medium">Voltar para login</a>
      </div>
    </div>
  </div>

  <script>
    document.getElementById('resendForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const error = document.getElementById('error');
      const success = document.getElementById('success');
      
      error.classList.add('hidden');
      success.classList.add('hidden');
      
      try {
        const response = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
          success.textContent = data.message;
          success.classList.remove('hidden');
          setTimeout(() => window.location.href = '/verify-pending', 2000);
        } else {
          error.textContent = data.error;
          error.classList.remove('hidden');
        }
      } catch (err) {
        error.textContent = 'Erro ao reenviar e-mail ';
        error.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>`;
