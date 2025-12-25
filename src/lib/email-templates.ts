export function getEmailTemplate(
  type: "verify" | "welcome" | "password-reset" | "2fa-code" | "email-change",
  data: any
): string {
  const baseStyle = `
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
      .header { padding: 40px 40px 20px; text-align: center; }
      .content { padding: 20px 40px 40px; }
      .button { display: inline-block; padding: 12px 32px; background: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
      .footer { padding: 20px 40px; text-align: center; color: #666666; font-size: 14px; border-top: 1px solid #e5e5e5; }
      h1 { font-size: 24px; margin: 0 0 10px; color: #000000; }
      p { color: #333333; line-height: 1.6; margin: 16px 0; }
      .muted { color: #666666; font-size: 14px; }
    </style>
  `;

  if (type === "verify") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirme seu e-mail </title>
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Epístola</h1>
          </div>
          <div class="content">
            <h1>Confirme seu e-mail </h1>
            <p>Olá, <strong>${data.name}</strong>!</p>
            <p>Obrigado por se registrar na Epístola. Para completar seu cadastro e começar a usar nossa plataforma, precisamos que você confirme seu endereço de e-mail .</p>
            <p style="text-align: center;">
              <a href="${data.verifyUrl}" class="button">Confirmar Email</a>
            </p>
            <p class="muted">Se você não criou uma conta na Epístola, pode ignorar este e-mail .</p>
            <p class="muted">Este link expira em 24 horas.</p>
          </div>
          <div class="footer">
            <p>Epístola - Plataforma Universal de Cartas Digitais</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === "welcome") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo à Epístola</title>
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Epístola</h1>
          </div>
          <div class="content">
            <h1>Bem-vindo à Epístola!</h1>
            <p>Olá, <strong>${data.name}</strong>!</p>
            <p>Seu e-mail foi confirmado com sucesso. Agora você pode aproveitar todos os recursos da nossa plataforma:</p>
            <ul style="color: #333333; line-height: 2;">
              <li>Criar e gerenciar seus Epistolários</li>
              <li>Integrar aplicações com OAuth 2.0</li>
              <li>Gerenciar missivas e coleções</li>
            </ul>
            <p style="text-align: center;">
              <a href="${data.dashboardUrl}" class="button">Acessar Dashboard</a>
            </p>
          </div>
          <div class="footer">
            <p>Epístola - Plataforma Universal de Cartas Digitais</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === "password-reset") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir senha</title>
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Epístola</h1>
          </div>
          <div class="content">
            <h1>Redefinir senha</h1>
            <p>Olá, <strong>${data.name}</strong>!</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta na Epístola.</p>
            <p style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <p class="muted">Se você não solicitou a redefinição de senha, pode ignorar este e-mail .</p>
            <p class="muted">Este link expira em 1 hora.</p>
          </div>
          <div class="footer">
            <p>Epístola - Plataforma Universal de Cartas Digitais</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === "2fa-code") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Código de verificação 2FA</title>
        ${baseStyle}
        <style>
          .code-box { background: #f5f5f5; border: 2px solid #e5e5e5; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
          .code { font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #000000; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Epístola</h1>
          </div>
          <div class="content">
            <h1>Código de Verificação</h1>
            <p>Olá, <strong>${data.name}</strong>!</p>
            <p>Use o código abaixo para completar sua autenticação:</p>
            <div class="code-box">
              <div class="code">${data.code}</div>
            </div>
            <p class="muted">Este código expira em 10 minutos.</p>
            <p class="muted">Se você não solicitou este código, ignore este e-mail e sua conta permanecerá segura.</p>
          </div>
          <div class="footer">
            <p>Epístola - Plataforma Universal de Cartas Digitais</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  if (type === "email-change") {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmar alteração de e-mail </title>
        ${baseStyle}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✉️ Epístola</h1>
          </div>
          <div class="content">
            <h1>Confirmar Novo Email</h1>
            <p>Olá, <strong>${data.name}</strong>!</p>
            <p>Você solicitou a alteração do e-mail da sua conta na Epístola para: <strong>${data.newEmail}</strong></p>
            <p>Clique no botão abaixo para confirmar esta alteração:</p>
            <p style="text-align: center;">
              <a href="${data.confirmUrl}" class="button">Confirmar Novo Email</a>
            </p>
            <p class="muted">Se você não solicitou esta alteração, ignore este e-mail .</p>
            <p class="muted">Este link expira em 1 hora.</p>
          </div>
          <div class="footer">
            <p>Epístola - Plataforma Universal de Cartas Digitais</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return "";
}
