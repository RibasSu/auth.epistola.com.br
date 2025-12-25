# Epistola Auth - Sistema de Autenticacao

Sistema completo de autenticacao para a plataforma Epistola, implementado como Cloudflare Worker com suporte a OAuth 2.0, autenticacao de dois fatores (2FA) e gerenciamento de epistolarios.

## Sumario

- [Visao Geral](#visao-geral)
- [Arquitetura](#arquitetura)
- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Banco de Dados](#banco-de-dados)
- [APIs e Endpoints](#apis-e-endpoints)
- [Fluxos de Autenticacao](#fluxos-de-autenticacao)
- [Sistema OAuth 2.0](#sistema-oauth-20)
- [Autenticacao de Dois Fatores](#autenticacao-de-dois-fatores)
- [Seguranca](#seguranca)
- [Configuracao](#configuracao)
- [Desenvolvimento](#desenvolvimento)
- [Deploy](#deploy)
- [Scripts Disponiveis](#scripts-disponiveis)

## Visao Geral

O Epistola Auth e um servico de autenticacao centralizado que permite:

- Registro e login de usuarios com verificacao de email
- Autenticacao de dois fatores via aplicativo TOTP e email
- Sistema OAuth 2.0 para integracao de aplicacoes externas (Epistolarios)
- Gerenciamento de sessoes e tokens
- Protecao contra bots com Cloudflare Turnstile
- Limpeza automatica de contas nao verificadas

## Arquitetura

O sistema e implementado como um Cloudflare Worker que processa todas as requisicoes HTTP. A arquitetura segue o padrao de separacao de responsabilidades:

- **Worker Principal**: Gerencia roteamento e lifecycle
- **APIs**: Handlers para autenticacao, perfil, epistolarios e OAuth
- **Bibliotecas**: Utilitarios compartilhados para criptografia, validacao, email e tokens
- **Banco de Dados**: Cloudflare D1 (SQLite distribuido)
- **Email**: Integracao com Resend API
- **Frontend**: Paginas HTML inline com TailwindCSS

### Fluxo de Requisicoes

```
Cliente -> Cloudflare Worker -> Validacao -> Processamento -> D1 Database
                                      |
                                      v
                              Servicos Externos
                              (Resend, Turnstile)
```

## Tecnologias

### Runtime e Infraestrutura

- **Cloudflare Workers**: Plataforma serverless edge computing
- **Bun**: Runtime JavaScript rapido para build e desenvolvimento
- **TypeScript**: Tipagem estatica e melhor experiencia de desenvolvimento
- **Wrangler**: CLI para gerenciar Workers

### Frontend

- **TailwindCSS**: Framework CSS utility-first via CDN
- **Cloudflare Turnstile**: Protecao contra bots
- **HTML inline**: Paginas servidas diretamente do Worker

### Banco de Dados

- **Cloudflare D1**: SQLite distribuido no edge
- **Schema SQL**: Estrutura relacional com indices otimizados

### Servicos Externos

- **Resend**: API para envio de emails transacionais
- **Cloudflare Turnstile**: Alternativa ao CAPTCHA

### Bibliotecas

- **React 19**: Componentes UI (para build)
- **Radix UI**: Componentes acessiveis
- **Lucide React**: Icones
- **class-variance-authority**: Gerenciamento de variantes CSS
- **tailwind-merge**: Merge de classes Tailwind

## Estrutura do Projeto

```
epistola.com.br-v001/
├── src/
│   ├── api/                    # Endpoints da API
│   │   ├── auth.ts            # Registro, login, logout, verificacao
│   │   ├── epistolary.ts      # CRUD de epistolarios
│   │   ├── oauth.ts           # Fluxo OAuth 2.0
│   │   └── profile.ts         # Gerenciamento de perfil e 2FA
│   ├── components/            # Componentes React UI
│   │   └── ui/               # Componentes base (button, input, card, etc)
│   ├── lib/                   # Bibliotecas utilitarias
│   │   ├── auth-utils.ts     # Hash, JWT, tokens
│   │   ├── cleanup.ts        # Limpeza de usuarios nao verificados
│   │   ├── cookies.ts        # Gerenciamento de cookies
│   │   ├── email.ts          # Envio de emails
│   │   ├── email-templates.ts # Templates de email
│   │   ├── totp.ts           # TOTP/2FA
│   │   ├── turnstile.ts      # Verificacao Turnstile
│   │   ├── utils.ts          # Utilitarios gerais
│   │   └── validator.ts      # Validacao e sanitizacao
│   ├── pages/                 # Paginas HTML
│   │   ├── settings.ts       # Pagina de configuracoes
│   │   ├── verify.ts         # Verificacao de email
│   │   └── verify-2fa.ts     # Verificacao 2FA
│   ├── types/                 # Definicoes TypeScript
│   │   ├── auth.ts           # Interfaces principais
│   │   └── d1.d.ts           # Tipos D1 Database
│   ├── index.ts               # Entry point Bun
│   └── worker.ts              # Entry point Cloudflare Worker
├── schema.sql                 # Schema do banco de dados
├── wrangler.toml             # Configuracao Cloudflare
├── package.json              # Dependencias
├── tsconfig.json             # Configuracao TypeScript
├── build.ts                  # Script de build customizado
├── components.json           # Configuracao componentes
└── bunfig.toml              # Configuracao Bun
```

## Banco de Dados

O sistema utiliza Cloudflare D1 (SQLite) com o seguinte esquema:

### Tabelas

#### users

Armazena informacoes de usuarios registrados.

```sql
- id: TEXT PRIMARY KEY (UUID)
- email: TEXT UNIQUE NOT NULL
- password_hash: TEXT NOT NULL (SHA-256)
- name: TEXT NOT NULL
- avatar_url: TEXT (opcional)
- email_verified: INTEGER (0 ou 1)
- email_verification_token: TEXT
- email_verification_expires: INTEGER (timestamp)
- last_verification_email_sent: INTEGER
- verification_email_count: INTEGER
- totp_secret: TEXT (segredo TOTP para 2FA)
- totp_enabled: INTEGER (0 ou 1)
- two_factor_email_enabled: INTEGER (0 ou 1)
- backup_codes: TEXT (JSON array de codigos)
- pending_email: TEXT (email pendente de mudanca)
- pending_email_token: TEXT
- pending_email_expires: INTEGER
- created_at: INTEGER (timestamp)
- updated_at: INTEGER (timestamp)
```

#### epistolaries

Armazena aplicacoes OAuth criadas pelos usuarios.

```sql
- id: TEXT PRIMARY KEY (UUID)
- user_id: TEXT NOT NULL (FK users.id)
- name: TEXT NOT NULL
- description: TEXT
- redirect_uris: TEXT (JSON array)
- client_secret: TEXT NOT NULL
- logo_url: TEXT
- website_url: TEXT
- scopes: TEXT (separado por espacos)
- active: INTEGER (0 ou 1)
- created_at: INTEGER
- updated_at: INTEGER
```

#### sessions

Gerencia sessoes de usuarios autenticados.

```sql
- id: TEXT PRIMARY KEY (UUID)
- user_id: TEXT NOT NULL (FK users.id)
- expires_at: INTEGER (timestamp)
- created_at: INTEGER
```

#### auth_codes

Codigos de autorizacao OAuth temporarios.

```sql
- code: TEXT PRIMARY KEY
- epistolary_id: TEXT NOT NULL (FK epistolaries.id)
- user_id: TEXT NOT NULL (FK users.id)
- redirect_uri: TEXT NOT NULL
- scopes: TEXT
- expires_at: INTEGER (padrao: 10 minutos)
- used: INTEGER (0 ou 1)
- created_at: INTEGER
```

#### access_tokens

Tokens de acesso OAuth.

```sql
- token: TEXT PRIMARY KEY
- epistolary_id: TEXT NOT NULL (FK epistolaries.id)
- user_id: TEXT NOT NULL (FK users.id)
- scopes: TEXT
- expires_at: INTEGER (padrao: 1 hora)
- created_at: INTEGER
```

#### refresh_tokens

Tokens de atualizacao OAuth.

```sql
- token: TEXT PRIMARY KEY
- access_token: TEXT NOT NULL
- epistolary_id: TEXT NOT NULL (FK epistolaries.id)
- user_id: TEXT NOT NULL (FK users.id)
- expires_at: INTEGER (padrao: 30 dias)
- created_at: INTEGER
```

#### two_factor_codes

Codigos de autenticacao de dois fatores via email.

```sql
- id: TEXT PRIMARY KEY (UUID)
- user_id: TEXT NOT NULL (FK users.id)
- code: TEXT NOT NULL (6 digitos)
- type: TEXT NOT NULL (login, enable, disable, etc)
- expires_at: INTEGER (padrao: 10 minutos)
- used: INTEGER (0 ou 1)
- created_at: INTEGER
```

### Indices

Todos os campos de foreign key possuem indices para otimizar consultas:

- `idx_users_email`, `idx_users_verification_token`, `idx_users_pending_email_token`
- `idx_epistolaries_user_id`
- `idx_sessions_user`
- `idx_auth_codes_epistolary`, `idx_auth_codes_user`
- `idx_access_tokens_epistolary`, `idx_access_tokens_user`
- `idx_refresh_tokens_epistolary`, `idx_refresh_tokens_user`, `idx_refresh_tokens_access`
- `idx_two_factor_codes_user`, `idx_two_factor_codes_code`

## APIs e Endpoints

### Autenticacao Base

#### POST /api/auth/register

Registra novo usuario.

**Request:**

```json
{
  "name": "Nome Usuario",
  "email": "maria.eduarda@muie.com.br",
  "password": "Senha123!",
  "turnstileToken": "token-cloudflare"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Usuario registrado com sucesso"
}
```

**Validacoes:**

- Email: 5-100 caracteres, formato valido
- Nome: 2-100 caracteres, apenas letras e espacos validos
- Senha: 8-128 caracteres, maiuscula, minuscula e numero obrigatorios
- Turnstile: Verificacao anti-bot obrigatoria

#### POST /api/auth/login

Realiza login do usuario.

**Request:**

```json
{
  "email": "maria.eduarda@muie.com.br",
  "password": "Senha123!",
  "turnstileToken": "token-cloudflare"
}
```

**Response (sucesso sem 2FA):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso"
}
```

**Response (requer 2FA):**

```json
{
  "success": true,
  "requires2fa": true,
  "message": "Codigo 2FA necessario"
}
```

#### POST /api/auth/logout

Encerra sessao do usuario.

**Response:**

```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### GET /api/auth/profile

Retorna informacoes do usuario autenticado.

**Response:**

```json
{
  "success": true,
  "id": "uuid",
  "email": "maria.eduarda@muie.com.br",
  "name": "Nome Usuario",
  "email_verified": 1,
  "totp_enabled": 0,
  "two_factor_email_enabled": 1,
  "created_at": 1234567890000
}
```

#### PUT /api/auth/profile

Atualiza perfil do usuario (deprecado - usar endpoints especificos).

#### GET /api/auth/verify-email/:token

Verifica email do usuario atraves do token enviado por email.

**Response:**

```json
{
  "success": true,
  "message": "Email verificado com sucesso"
}
```

#### POST /api/auth/resend-verification

Reenvia email de verificacao.

**Request:**

```json
{
  "turnstileToken": "token-cloudflare"
}
```

**Limites:**

- Maximo 5 emails por conta
- Minimo 60 segundos entre envios

### Autenticacao de Dois Fatores

#### POST /api/auth/2fa/send-login-code

Envia codigo 2FA via email durante login.

**Response:**

```json
{
  "success": true,
  "message": "Codigo enviado para seu email"
}
```

#### POST /api/auth/2fa/verify-login

Verifica codigo 2FA durante login.

**Request:**

```json
{
  "code": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "2FA verificado com sucesso"
}
```

### Gerenciamento de Perfil

#### POST /api/profile/2fa/setup

Gera configuracao para 2FA via aplicativo.

**Response:**

```json
{
  "success": true,
  "secret": "BASE32SECRET",
  "otpauthUrl": "otpauth://totp/...",
  "qrCode": "https://api.qrserver.com/...",
  "backupCodes": ["code1", "code2", ...]
}
```

#### POST /api/profile/2fa/enable

Ativa 2FA via aplicativo.

**Request:**

```json
{
  "emailCode": "123456",
  "totpCode": "123456",
  "backupCodes": ["code1", "code2", ...],
  "turnstileToken": "token-cloudflare"
}
```

#### POST /api/profile/2fa/disable

Desativa 2FA via aplicativo.

**Request:**

```json
{
  "emailCode": "123456",
  "password": "SenhaAtual123!",
  "turnstileToken": "token-cloudflare"
}
```

#### POST /api/profile/2fa/send-code

Envia codigo 2FA via email para operacoes de perfil.

**Request:**

```json
{
  "type": "enable_2fa" | "disable_2fa" | "change_email",
  "turnstileToken": "token-cloudflare"
}
```

#### PUT /api/profile/name

Atualiza nome do usuario.

**Request:**

```json
{
  "name": "Novo Nome"
}
```

#### PUT /api/profile/password

Altera senha do usuario.

**Request:**

```json
{
  "currentPassword": "SenhaAtual123!",
  "newPassword": "NovaSenha123!",
  "turnstileToken": "token-cloudflare"
}
```

#### POST /api/profile/email/change

Solicita mudanca de email.

**Request:**

```json
{
  "newEmail": "duda@muie.com.br",
  "emailCode": "123456",
  "turnstileToken": "token-cloudflare"
}
```

#### GET /confirm-email-change?token=...

Confirma mudanca de email atraves do link enviado.

### Gerenciamento de Epistolarios

#### POST /api/epistolaries

Cria novo epistolario (aplicacao OAuth).

**Request:**

```json
{
  "name": "Meu Epistolario",
  "description": "Descricao opcional",
  "redirect_uris": ["https://app.example.com/callback"],
  "logo_url": "https://example.com/logo.png",
  "website_url": "https://example.com",
  "scopes": "basic profile"
}
```

**Response:**

```json
{
  "success": true,
  "epistolary": {
    "id": "client-id-uuid",
    "name": "Meu Epistolario",
    "client_secret": "secret-token",
    "redirect_uris": [...],
    "scopes": "basic profile"
  }
}
```

#### GET /api/epistolaries

Lista epistolarios do usuario autenticado.

**Response:**

```json
{
  "success": true,
  "epistolaries": [
    {
      "id": "uuid",
      "name": "Nome",
      "description": "Descricao",
      "active": 1
    }
  ]
}
```

#### GET /api/epistolaries/:id

Retorna detalhes de um epistolario especifico.

**Response:**

```json
{
  "success": true,
  "epistolary": {
    "id": "uuid",
    "name": "Nome",
    "description": "Descricao",
    "redirect_uris": [...],
    "client_secret": "secret",
    "scopes": "basic",
    "active": 1
  }
}
```

#### PUT /api/epistolaries/:id

Atualiza informacoes do epistolario.

**Request:**

```json
{
  "name": "Novo Nome",
  "description": "Nova descricao",
  "redirect_uris": ["https://new.example.com/callback"]
}
```

#### DELETE /api/epistolaries/:id

Remove epistolario (soft delete - marca como inativo).

#### POST /api/epistolaries/:id/regenerate

Gera novo client_secret para o epistolario.

**Response:**

```json
{
  "success": true,
  "client_secret": "novo-secret-token"
}
```

### OAuth 2.0

#### GET /oauth/authorize

Inicia fluxo de autorizacao OAuth.

**Query Parameters:**

```
client_id: ID do epistolario
redirect_uri: URI de callback registrada
scope: Escopos solicitados (opcional, padrao: "basic")
state: Estado para CSRF (opcional mas recomendado)
```

**Response (usuario nao autenticado):**

```json
{
  "login_required": true,
  "epistolary": {
    "id": "uuid",
    "name": "Nome",
    "scopes": ["basic"]
  }
}
```

**Response (usuario autenticado):**

```
HTTP 302 Redirect
Location: https://redirect-uri?code=auth-code&state=...
```

#### POST /oauth/token

Troca authorization code por access token.

**Request (application/x-www-form-urlencoded ou JSON):**

```
grant_type: authorization_code | refresh_token
code: Authorization code (para authorization_code)
refresh_token: Refresh token (para refresh_token)
client_id: ID do epistolario
client_secret: Secret do epistolario
redirect_uri: URI de callback (apenas para authorization_code)
```

**Response:**

```json
{
  "access_token": "token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh-token",
  "scope": "basic"
}
```

#### GET /oauth/userinfo

Retorna informacoes do usuario autenticado via OAuth.

**Headers:**

```
Authorization: Bearer {access_token}
```

**Response:**

```json
{
  "sub": "user-id",
  "email": "maria.eduarda@muie.com.br",
  "name": "Nome Usuario",
  "email_verified": true
}
```

#### POST /oauth/revoke

Revoga access token ou refresh token.

**Request:**

```json
{
  "token": "token-to-revoke",
  "token_type_hint": "access_token" | "refresh_token"
}
```

### Paginas HTML

#### GET /

Pagina de login.

#### GET /register

Pagina de registro.

#### GET /dashboard

Dashboard do usuario (requer autenticacao).

#### GET /verify-pending

Pagina de verificacao de email pendente.

#### GET /verify-email?token=...

Pagina de confirmacao de email.

#### GET /verify-2fa

Pagina de verificacao 2FA durante login.

#### GET /settings

Pagina de configuracoes do usuario.

#### GET /health

Health check do servico.

**Response:**

```json
{
  "status": "ok",
  "service": "epistola-auth"
}
```

## Fluxos de Autenticacao

### Fluxo de Registro

1. Usuario acessa `/register`
2. Preenche nome, email e senha
3. Resolve Cloudflare Turnstile
4. Sistema valida dados (email, nome, senha)
5. Sistema cria usuario com email_verified=0
6. Sistema envia email de verificacao
7. Usuario e redirecionado para `/verify-pending`
8. Usuario clica no link do email
9. Sistema verifica token e marca email como verificado
10. Usuario e redirecionado para `/dashboard`

### Fluxo de Login sem 2FA

1. Usuario acessa `/`
2. Preenche email e senha
3. Resolve Cloudflare Turnstile
4. Sistema valida credenciais
5. Sistema cria sessao
6. Sistema define cookie de sessao
7. Usuario e redirecionado para `/dashboard`

### Fluxo de Login com 2FA

1. Usuario acessa `/`
2. Preenche email e senha
3. Resolve Cloudflare Turnstile
4. Sistema valida credenciais
5. Sistema detecta 2FA ativo
6. Sistema cria sessao temporaria
7. Usuario e redirecionado para `/verify-2fa`
8. Sistema envia codigo via email (se 2FA email ativo)
9. Usuario insere codigo TOTP ou email ou backup code
10. Sistema valida codigo
11. Sistema confirma sessao
12. Usuario e redirecionado para `/dashboard`

### Fluxo de Ativacao 2FA

1. Usuario autenticado acessa `/settings`
2. Clica em "Ativar 2FA"
3. Sistema gera secret TOTP e backup codes
4. Sistema exibe QR code
5. Usuario escaneia QR code no app autenticador
6. Sistema envia codigo via email
7. Usuario insere codigo do app + codigo do email
8. Resolve Cloudflare Turnstile
9. Sistema valida ambos os codigos
10. Sistema ativa 2FA e salva backup codes
11. Sistema exibe backup codes para usuario salvar

## Sistema OAuth 2.0

O sistema implementa OAuth 2.0 Authorization Code Flow para permitir que aplicacoes externas (Epistolarios) se integrem com autenticacao centralizada.

### Conceitos

- **Epistolario**: Aplicacao OAuth criada por um usuario
- **Client ID**: ID unico do epistolario (UUID)
- **Client Secret**: Credencial secreta do epistolario
- **Authorization Code**: Codigo temporario (10 minutos)
- **Access Token**: Token de acesso (1 hora)
- **Refresh Token**: Token para renovacao (30 dias)
- **Scopes**: Permissoes solicitadas (basic, profile, email)

### Fluxo Completo

1. **Criar Epistolario**

   - Usuario autenticado cria epistolario via `/api/epistolaries`
   - Sistema gera client_id e client_secret
   - Usuario configura redirect_uris permitidas

2. **Autorizacao**

   - Epistolario redireciona usuario para `/oauth/authorize`
   - URL inclui client_id, redirect_uri, scope e state
   - Sistema valida client_id e redirect_uri
   - Usuario faz login se necessario
   - Sistema gera authorization code
   - Sistema redireciona para redirect_uri com code

3. **Troca por Token**

   - Epistolario envia POST para `/oauth/token`
   - Inclui code, client_id, client_secret, redirect_uri
   - Sistema valida code e credenciais
   - Sistema gera access_token e refresh_token
   - Sistema retorna tokens

4. **Acessar Recursos**

   - Epistolario usa access_token em header Authorization
   - Faz GET para `/oauth/userinfo`
   - Sistema valida token
   - Sistema retorna dados do usuario

5. **Renovar Token**

   - Quando access_token expira
   - Epistolario envia POST para `/oauth/token`
   - Inclui grant_type=refresh_token, refresh_token, client_id, client_secret
   - Sistema valida refresh_token
   - Sistema gera novo access_token
   - Sistema retorna novo token

6. **Revogar Token**
   - Epistolario envia POST para `/oauth/revoke`
   - Inclui token a ser revogado
   - Sistema invalida token

### Exemplo de Integracao

```javascript
// 1. Redirecionar para autorizacao
const authUrl =
  `https://auth.epistola.com.br/oauth/authorize?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `scope=basic profile&` +
  `state=${randomState}`;
window.location.href = authUrl;

// 2. Receber callback e trocar code por token
const code = new URLSearchParams(window.location.search).get("code");
const response = await fetch("https://auth.epistola.com.br/oauth/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type: "authorization_code",
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  }),
});
const { access_token, refresh_token } = await response.json();

// 3. Buscar informacoes do usuario
const userResponse = await fetch(
  "https://auth.epistola.com.br/oauth/userinfo",
  {
    headers: { Authorization: `Bearer ${access_token}` },
  }
);
const user = await userResponse.json();
```

## Autenticacao de Dois Fatores

O sistema suporta multiplos metodos de 2FA:

### TOTP (Time-based One-Time Password)

- Baseado no algoritmo RFC 6238
- Compativel com Google Authenticator, Authy, etc
- Codigos de 6 digitos validos por 30 segundos
- Secret de 32 caracteres em Base32
- Window de +-1 periodo para clock drift

### Email 2FA

- Codigo de 6 digitos enviado via email
- Validade de 10 minutos
- Limite de tentativas por seguranca
- Usado como fallback ou metodo primario

### Backup Codes

- 10 codigos de uso unico gerados na ativacao
- Formato: XXXX-XXXX (8 caracteres)
- Armazenados como hash no banco
- Usados quando usuario perde acesso ao app/email

### Implementacao

O sistema utiliza Web Crypto API para operacoes criptograficas:

```typescript
// Geracao de secret TOTP
function generateTOTPSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const length = 32;
  let secret = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    secret += chars[randomBytes[i]! % chars.length];
  }
  return secret;
}

// Verificacao TOTP
async function verifyTOTP(secret: string, token: string): Promise<boolean> {
  const window = 1; // Aceita +-30 segundos
  const time = Math.floor(Date.now() / 1000 / 30);

  for (let i = -window; i <= window; i++) {
    const counter = time + i;
    const expectedToken = await generateTOTPToken(secret, counter);
    if (token === expectedToken) {
      return true;
    }
  }
  return false;
}
```

## Seguranca

### Criptografia e Hashing

#### Senhas

- Algoritmo: SHA-256
- Funcao: `crypto.subtle.digest`
- Armazenamento: Base64 encoded
- Nota: Para producao, considerar bcrypt/argon2 para maior seguranca

#### JWT (JSON Web Tokens)

- Algoritmo: HS256 (HMAC-SHA256)
- Secret: Variavel de ambiente `JWT_SECRET`
- Payload: `{ sub: userId, iat: timestamp, exp: timestamp }`
- Expiracao: Configuravel por tipo de token

#### Tokens Aleatorios

- Fonte: `crypto.getRandomValues`
- Tamanho: 32 bytes
- Codificacao: Base64 URL-safe (sem +, /, =)

### Validacao de Entrada

Todas as entradas sao validadas e sanitizadas:

#### Email

- Comprimento: 5-100 caracteres
- Formato: RFC 5322 simplificado
- Caracteres: a-z, 0-9, ., -, \_, +, @
- Normalizacao: lowercase e trim
- Validacoes: ponto inicial/final, pontos consecutivos, parte local, dominio

#### Nome

- Comprimento: 2-100 caracteres
- Caracteres: letras (Unicode), espacos, apostrofos, hifens
- Validacoes: espacos multiplos, posicoes validas de caracteres especiais
- Sanitizacao: trim e normalizacao de espacos

#### Senha

- Comprimento: 8-128 caracteres
- Caracteres: A-Z, a-z, 0-9, simbolos permitidos
- Requisitos obrigatorios:
  - Pelo menos uma letra maiuscula
  - Pelo menos uma letra minuscula
  - Pelo menos um numero
- Simbolos permitidos: !@#$%^&\*()\_+-=[]{}|;:,.<>?

### Protecao Contra Ataques

#### CSRF (Cross-Site Request Forgery)

- Cookies com flag SameSite=Strict
- Header X-Requested-With validation
- State parameter no fluxo OAuth

#### XSS (Cross-Site Scripting)

- Sanitizacao rigorosa de entradas
- Content Security Policy headers
- HTML escaping em outputs

#### SQL Injection

- Prepared statements exclusivamente
- Parametrizacao de todas as queries
- Sem concatenacao de strings SQL

#### Brute Force

- Cloudflare Turnstile em formularios sensives
- Rate limiting no edge via Cloudflare
- Limite de tentativas 2FA

#### Session Hijacking

- Cookies HttpOnly
- Cookies Secure (HTTPS only)
- Session expiration
- Regeneracao de session ID apos login

#### Bot Protection

- Cloudflare Turnstile obrigatorio em:
  - Registro
  - Login
  - Operacoes sensiveis (mudanca senha/email)
  - Ativacao/desativacao 2FA

### Limpeza Automatica

Cron job executado a cada 6 horas:

```typescript
// Triggered by: triggers.crons = ["0 */6 * * *"]
async function cleanupUnverifiedUsers(env: Env): Promise<number> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const result = await env.DB.prepare(
    "DELETE FROM users WHERE email_verified = 0 AND created_at < ?"
  )
    .bind(oneDayAgo)
    .all();
  return result.results?.length || 0;
}
```

Remove usuarios nao verificados apos 24 horas da criacao.

## Configuracao

### Variaveis de Ambiente

#### Producao (Secrets via Wrangler)

```bash
# JWT Secret (32+ caracteres randomicos)
wrangler secret put JWT_SECRET

# Resend API Key para envio de emails
wrangler secret put RESEND_API_KEY

# Cloudflare Turnstile Secret Keys
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put TURNSTILE_SECRET_KEY2
```

#### Configuracao (wrangler.toml)

```toml
# Variaveis publicas
SESSION_DURATION = "2592000"        # 30 dias
AUTH_CODE_DURATION = "600"          # 10 minutos
ACCESS_TOKEN_DURATION = "3600"      # 1 hora
REFRESH_TOKEN_DURATION = "2592000"  # 30 dias
RESEND_FROM_EMAIL = "Auth Epistola <seguranca@epistola.com.br>"
TURNSTILE_SITE_KEY = "0x4AAAAAACI7dISm-doQgS3r"
TURNSTILE_SITE_KEY2 = "0x4AAAAAACJEOZrFT9N8lddD"

# URL da aplicacao (varia por ambiente)
[env.development.vars]
APP_URL = "http://localhost:8787"

[env.production.vars]
APP_URL = "https://auth.epistola.com.br"
```

#### Desenvolvimento Local (.dev.vars)

Criar arquivo `.dev.vars` na raiz (nao comitar):

```bash
JWT_SECRET=seu-secret-local-desenvolvimento
RESEND_API_KEY=re_sua_chave_local
TURNSTILE_SECRET_KEY=sua-chave-local
TURNSTILE_SECRET_KEY2=sua-chave-local-2
```

### Banco de Dados D1

#### Criar Database

```bash
# Listar databases existentes
wrangler d1 list

# Criar nova database (se necessario)
wrangler d1 create auth-epistola

# Atualizar database_id no wrangler.toml
```

#### Executar Migracao

```bash
# Local (desenvolvimento)
npm run db:local
# ou
wrangler d1 execute auth-epistola --local --file=./schema.sql

# Producao
npm run db:migrate
# ou
wrangler d1 execute auth-epistola --file=./schema.sql
```

#### Consultas Manuais

```bash
# Console interativo local
wrangler d1 execute auth-epistola --local --command="SELECT * FROM users;"

# Console interativo producao
wrangler d1 execute auth-epistola --command="SELECT COUNT(*) FROM users;"
```

### Servico de Email (Resend)

1. Criar conta em https://resend.com
2. Verificar dominio epistola.com.br
3. Adicionar registros DNS:
   - TXT para verificacao
   - MX, TXT (SPF), TXT (DKIM) para envio
4. Gerar API key
5. Configurar em secrets: `wrangler secret put RESEND_API_KEY`

### Cloudflare Turnstile

1. Acessar Cloudflare Dashboard
2. Ir em Turnstile
3. Criar dois sites (formularios diferentes)
4. Copiar Site Keys (publicas) para wrangler.toml
5. Copiar Secret Keys para secrets

## Desenvolvimento

### Requisitos

- Bun >= 1.0.0
- Wrangler >= 3.0.0
- Node.js >= 18 (opcional, Bun pode substituir)

### Instalacao

```bash
# Clonar repositorio
git clone https://github.com/RibasSu/epistola.com.br-v001.git
cd epistola.com.br-v001

# Instalar dependencias
bun install
```

### Configuracao Local

```bash
# Copiar exemplo de variaveis
cp .dev.vars.example .dev.vars

# Editar .dev.vars com suas credenciais
nano .dev.vars

# Inicializar banco local
bun run db:local
```

### Executar Localmente

```bash
# Modo desenvolvimento (hot reload)
bun run dev
# ou
wrangler dev

# Acessar aplicacao
open http://localhost:8787
```

### Modo de Desenvolvimento Remoto

```bash
# Usar recursos de producao (database, etc)
bun run dev:remote
# ou
wrangler dev --remote
```

### Build

```bash
# Build para producao
bun run build

# Build customizado com opcoes
bun run build.ts --outdir=dist --minify --sourcemap=linked

# Ver ajuda do build
bun run build.ts --help
```

### Estrutura de Build

O script `build.ts` processa:

- Arquivos HTML em `src/**/*.html`
- Compila TypeScript
- Processa TailwindCSS com plugin Bun
- Minifica codigo
- Gera sourcemaps
- Output para `dist/`

## Deploy

### Pre-requisitos

1. Conta Cloudflare com Workers habilitado
2. Variaveis de ambiente configuradas
3. Database D1 criado e migrado
4. Dominio configurado (opcional)

### Deploy para Producao

```bash
# Configurar secrets (primeira vez)
echo "seu-jwt-secret" | wrangler secret put JWT_SECRET
echo "sua-resend-key" | wrangler secret put RESEND_API_KEY
echo "sua-turnstile-key" | wrangler secret put TURNSTILE_SECRET_KEY
echo "sua-turnstile-key-2" | wrangler secret put TURNSTILE_SECRET_KEY2

# Executar migracao em producao
bun run db:migrate

# Deploy
bun run deploy
# ou
wrangler deploy --env production

# Verificar deploy
curl https://auth.epistola.com.br/health
```

### Monitoramento

```bash
# Logs em tempo real
wrangler tail

# Logs filtrados
wrangler tail --format=pretty --status=error

# Metricas
wrangler pages deployment list
```

### Rollback

```bash
# Listar deployments
wrangler deployments list

# Rollback para versao anterior
wrangler rollback [deployment-id]
```

## Scripts Disponiveis

Definidos em `package.json`:

```json
{
  "scripts": {
    "dev": "wrangler dev",
    "dev:remote": "wrangler dev --remote",
    "start": "wrangler dev",
    "build": "bun run build.ts",
    "deploy": "wrangler deploy --env production",
    "db:migrate": "wrangler d1 execute auth-epistola --file=./schema.sql",
    "db:local": "wrangler d1 execute auth-epistola --local --file=./schema.sql"
  }
}
```

### Descricao dos Scripts

#### dev

Inicia servidor de desenvolvimento local com hot reload.

- Porta: 8787
- Database: Local SQLite
- Variaveis: .dev.vars

#### dev:remote

Inicia desenvolvimento usando recursos de producao.

- Util para testar com dados reais
- Requer autenticacao Cloudflare

#### start

Alias para `dev`.

#### build

Executa build customizado via build.ts.

- Processa HTML + CSS + JS
- Minifica codigo
- Gera sourcemaps
- Output: dist/

#### deploy

Faz deploy para ambiente de producao.

- Envia codigo para Cloudflare Workers
- Usa variaveis do wrangler.toml [env.production]
- URL: https://auth.epistola.com.br

#### db:migrate

Executa schema.sql no banco de producao.

- Cria tabelas se nao existirem
- Cria indices
- Idempotente (safe para re-executar)

#### db:local

Executa schema.sql no banco local.

- Para desenvolvimento
- Cria estrutura local

## Consideracoes Finais

### Performance

- Edge computing: Latencia < 50ms globalmente
- D1 distribuido: Queries rapidas em qualquer regiao
- Worker otimizado: Cold start < 10ms
- Caching agressivo de assets estaticos

### Escalabilidade

- Cloudflare Workers: Scale automatico
- D1 Database: Suporta milhoes de requisicoes
- Sem servidor: Paga apenas pelo uso
- Global distribution: 275+ data centers

### Limitacoes Conhecidas

1. **Hashing de Senha**: SHA-256 e menos seguro que bcrypt/argon2

   - Recomendacao: Migrar para hashing mais robusto em futuras versoes

2. **Rate Limiting**: Depende de Cloudflare edge

   - Recomendacao: Implementar rate limiting adicional na aplicacao

3. **Email Delivery**: Depende de servico externo (Resend)

   - Recomendacao: Implementar fallback ou retry logic

4. **Session Storage**: Apenas no banco D1
   - Recomendacao: Considerar KV para sessions de alta frequencia

### Proximos Passos

1. Implementar sistema de Selos (moeda digital)
2. Desenvolver sistema de Missivas (cartas digitais)
3. Criar marketplace de Epistolarios
4. Adicionar suporte a WebAuthn/FIDO2
5. Implementar audit log completo
6. Adicionar metricas e analytics detalhados
7. Desenvolver painel administrativo

### Contribuicao

Para contribuir com o projeto:

1. Fork o repositorio
2. Crie branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudancas (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra Pull Request

### Suporte

- Issues: https://github.com/RibasSu/auth.epistola.com.br/issues
- Email: andre@ribassu.com

### Licenca

Este projeto esta sob a Licenca LIKNCORP EPÍSTOLA RESTRICTED SOURCE LICENSE. Veja arquivo LICENSE para detalhes.

---

Documentacao gerada em: 2025-12-25  
Versao: 0.1.0  
Mantenedor: RibasSu
