# API OAuth - Epístola Auth

## Visão Geral

A API OAuth do Epístola Auth permite que aplicações terceiras (Epistolários) integrem autenticação de usuários de forma segura e padronizada.

## Fluxo de Autenticação

### 1. Criar Sessão OAuth

**Endpoint:** `POST /api/oauth/session`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "client_id": "seu_client_id",
  "client_secret": "seu_client_secret",
  "target_user": "all", // ou email específico
  "external_id": "abc123", // opcional, até 10 caracteres alfanuméricos
  "scopes": ["auth", "email", "name"],
  "callback_url": "https://app.muie.com.br/callback" // opcional
}
```

**Resposta de Sucesso:**

```json
{
  "success": true,
  "auth_url": "https://auth.epistola.com.br/oauth/authorize?session=uuid",
  "session_token": "uuid",
  "expires_in": 600
}
```

**Parâmetros:**

- `target_user`: `"all"` para qualquer usuário, ou email específico para validar identidade
- `external_id`: Identificador externo opcional para rastreamento no seu sistema
- `scopes`: Array de permissões solicitadas (veja seção Permissões)
- `callback_url`: URL de retorno (deve estar na lista de URLs permitidas no painel)

### 2. Redirecionar Usuário

Redirecione o usuário para a URL retornada no `auth_url`. O usuário verá:

- Informações do seu aplicativo (nome, logo, status de verificação)
- Lista de permissões solicitadas
- Opção de autorizar ou cancelar

### 3. Consultar Status da Sessão

**Endpoint:** `GET /api/oauth/session/{session_token}`

**Headers:**

```
Authorization: Bearer {client_secret}
```

**Resposta - Pendente:**

```json
{
  "success": true,
  "status": "pending",
  "external_id": "abc123",
  "created_at": 1234567890
}
```

**Resposta - Completa:**

```json
{
  "success": true,
  "status": "completed",
  "external_id": "abc123",
  "access_token": "token_para_acessar_dados",
  "created_at": 1234567890
}
```

**Resposta - Cancelada/Falha:**

```json
{
  "success": true,
  "status": "cancelled", // ou "failed"
  "error_code": "user_cancelled", // ou "user_mismatch", "expired"
  "external_id": "abc123",
  "created_at": 1234567890
}
```

### 4. Callback Automático

Após autorização/cancelamento, o usuário é redirecionado para a sua `callback_url` com parâmetros:

**Sucesso:**

```
https://app.muie.com.br/callback?status=success&token=uuid&external_id=abc123
```

**Falha:**

```
https://app.muie.com.br/callback?status=failed&error=user_mismatch&external_id=abc123
```

**Cancelado:**

```
https://app.muie.com.br/callback?status=cancelled&error=user_cancelled&external_id=abc123
```

### 5. Obter Dados do Usuário

**Endpoint:** `GET /api/oauth/user/{access_token}`

**Headers:**

```
Authorization: Bearer {client_secret}
```

**Resposta:**

```json
{
  "success": true,
  "user": {
    "user_id": "uuid",
    "email": "maria.eduarda@muie.com.br",
    "name": "Nome do Usuário",
    "avatar_url": "https://...",
    "scopes": ["email", "name", "avatar"]
  }
}
```

**Nota:** Os dados retornados dependem das permissões concedidas.

## Permissões (Scopes)

### Básicas (Não Críticas)

| Código   | Nome                | Descrição                     | Requer Verificado |
| -------- | ------------------- | ----------------------------- | ----------------- |
| `auth`   | Autenticação básica | Acesso a email, nome e avatar | Não               |
| `email`  | E-mail              | Acesso ao endereço de e-mail  | Não               |
| `name`   | Nome                | Acesso ao nome completo       | Não               |
| `avatar` | Foto de perfil      | Acesso à foto de perfil       | Não               |

**Nota:** O scope `auth` é um alias que expande para `email`, `name` e `avatar`.

### Críticas (Requerem Epistolário Verificado)

| Código            | Nome           | Descrição                   | Badge |
| ----------------- | -------------- | --------------------------- | ----- |
| `profile:edit`    | Editar perfil  | Alterar nome e foto         | ⚠️    |
| `email:change`    | Alterar e-mail | Solicitar mudança de e-mail | ⚠️    |
| `password:change` | Alterar senha  | Alterar senha do usuário    | ⚠️    |

### Oficiais (Requerem Epistolário Oficial)

| Código           | Nome          | Descrição                         | Badge |
| ---------------- | ------------- | --------------------------------- | ----- |
| `account:delete` | Excluir conta | Excluir permanentemente a conta   | 🔒    |
| `2fa:manage`     | Gerenciar 2FA | Ativar/desativar autenticação 2FA | 🔒    |

## Badges e Verificação

### Epistolário Verificado

- Badge azul de verificação
- Pode solicitar permissões críticas
- Aumenta confiança do usuário

### Epistolário Oficial

- Badge verde oficial
- Desenvolvido pela equipe Epístola
- Pode solicitar todas as permissões

## Códigos de Erro

| Código                | Descrição                                         |
| --------------------- | ------------------------------------------------- |
| `user_cancelled`      | Usuário cancelou a autorização                    |
| `user_mismatch`       | E-mail do usuário não corresponde ao solicitado   |
| `expired`             | Sessão expirou (timeout de 10 minutos)            |
| `invalid_credentials` | client_id ou client_secret inválidos              |
| `invalid_scope`       | Permissão solicitada não existe ou não disponível |
| `unauthorized`        | Epistolário não verificado para permissão crítica |

## Segurança

1. **Nunca exponha seu `client_secret`** - Use apenas no backend
2. **Valide a URL de callback** - Certifique-se de que a URL pertence ao seu domínio
3. **Tokens expiram** - Access tokens expiram em 1 hora, sessions em 10 minutos
4. **HTTPS obrigatório** - Todas as URLs de callback devem usar HTTPS em produção
5. **Validação de usuário** - Use `target_user` quando souber o email esperado

## Exemplo de Implementação (Node.js)

```javascript
// 1. Criar sessão OAuth
const response = await fetch("https://auth.epistola.com.br/api/oauth/session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_id: process.env.EPISTOLA_CLIENT_ID,
    client_secret: process.env.EPISTOLA_CLIENT_SECRET,
    scopes: ["auth"],
    external_id: "user_" + userId,
    callback_url: "https://app.muie.com.br/auth/callback",
  }),
});

const { auth_url, session_token } = await response.json();

// 2. Guardar session_token no banco/sessão
await saveSession(userId, session_token);

// 3. Redirecionar usuário
res.redirect(auth_url);

// 4. Na rota de callback
app.get("/auth/callback", async (req, res) => {
  const { status, token, external_id, error } = req.query;

  if (status === "success") {
    // Buscar dados do usuário
    const userResponse = await fetch(
      `https://auth.epistola.com.br/api/oauth/user/${token}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.EPISTOLA_CLIENT_SECRET}`,
        },
      }
    );

    const { user } = await userResponse.json();

    // Criar sessão local
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.redirect("/login?error=" + error);
  }
});
```

## Limites de Taxa

- Criação de sessões: 10 por minuto por client_id
- Consultas de status: 100 por minuto por client_id
- Obtenção de dados: 100 por minuto por client_id

## Suporte

Para dúvidas ou problemas:

- Email: andre@ribassu.com
- Documentação: https://docs.epistola.com.br
