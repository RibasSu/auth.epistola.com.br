CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  email_verified INTEGER DEFAULT 0,
  email_verification_token TEXT,
  email_verification_expires INTEGER,
  last_verification_email_sent INTEGER,
  verification_email_count INTEGER DEFAULT 0,
  totp_secret TEXT,
  totp_enabled INTEGER DEFAULT 0,
  two_factor_email_enabled INTEGER DEFAULT 1,
  backup_codes TEXT,
  pending_email TEXT,
  pending_email_token TEXT,
  pending_email_expires INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
CREATE INDEX idx_users_pending_email_token ON users(pending_email_token);

CREATE TABLE IF NOT EXISTS two_factor_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_two_factor_codes_user ON two_factor_codes(user_id);
CREATE INDEX idx_two_factor_codes_code ON two_factor_codes(code);

CREATE TABLE IF NOT EXISTS epistolaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  redirect_uris TEXT NOT NULL,
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  is_verified INTEGER DEFAULT 0,
  is_official INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_epistolaries_user_id ON epistolaries(user_id);
CREATE INDEX idx_epistolaries_client_id ON epistolaries(client_id);

CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_critical INTEGER DEFAULT 0,
  requires_verified INTEGER DEFAULT 0,
  requires_official INTEGER DEFAULT 0,
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_permissions_code ON permissions(code);

CREATE TABLE IF NOT EXISTS oauth_sessions (
  id TEXT PRIMARY KEY,
  epistolary_id TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  external_id TEXT,
  target_user TEXT,
  requested_scopes TEXT NOT NULL,
  callback_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  user_id TEXT,
  access_token TEXT,
  error_code TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_oauth_sessions_token ON oauth_sessions(session_token);
CREATE INDEX idx_oauth_sessions_epistolary ON oauth_sessions(epistolary_id);
CREATE INDEX idx_oauth_sessions_status ON oauth_sessions(status);

CREATE TABLE IF NOT EXISTS oauth_user_tokens (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  epistolary_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  granted_scopes TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES oauth_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_oauth_user_tokens_token ON oauth_user_tokens(token);
CREATE INDEX idx_oauth_user_tokens_epistolary ON oauth_user_tokens(epistolary_id);
CREATE INDEX idx_oauth_user_tokens_user ON oauth_user_tokens(user_id);

CREATE TABLE IF NOT EXISTS epistolary_delete_requests (
  token TEXT PRIMARY KEY,
  epistolary_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_epistolary_delete_requests_epistolary ON epistolary_delete_requests(epistolary_id);
CREATE INDEX idx_epistolary_delete_requests_expires ON epistolary_delete_requests(expires_at);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Permissões básicas (não críticas)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_email', 'email', 'E-mail', 'Acesso ao seu endereço de e-mail', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_name', 'name', 'Nome', 'Acesso ao seu nome completo', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_avatar', 'avatar', 'Foto de perfil', 'Acesso à sua foto de perfil', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_auth', 'auth', 'Autenticação básica', 'Acesso às suas informações básicas de perfil (nome, e-mail e foto)', 0, 0, 0, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Permissões críticas (requerem verificação)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_profile_edit', 'profile:edit', 'Editar perfil', 'Permite ao aplicativo alterar suas informações de perfil (nome e foto)', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_email_change', 'email:change', 'Alterar e-mail', 'Permite ao aplicativo solicitar alteração do seu endereço de e-mail', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_password_change', 'password:change', 'Alterar senha', 'Permite ao aplicativo alterar sua senha', 1, 1, 0, 1, strftime('%s', 'now'), strftime('%s', 'now'));

-- Permissões oficiais (apenas para Epistolários oficiais)
INSERT INTO permissions (id, code, name, description, is_critical, requires_verified, requires_official, active, created_at, updated_at) VALUES
('perm_account_delete', 'account:delete', 'Excluir conta', 'Permite ao aplicativo excluir permanentemente sua conta', 1, 1, 1, 1, strftime('%s', 'now'), strftime('%s', 'now')),
('perm_2fa_manage', '2fa:manage', 'Gerenciar 2FA', 'Permite ao aplicativo ativar ou desativar autenticação de dois fatores', 1, 1, 1, 1, strftime('%s', 'now'), strftime('%s', 'now'));
