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
  client_secret TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  scopes TEXT NOT NULL DEFAULT 'basic',
  active INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_epistolaries_user_id ON epistolaries(user_id);

CREATE TABLE IF NOT EXISTS auth_codes (
  code TEXT PRIMARY KEY,
  epistolary_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  scopes TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_codes_epistolary ON auth_codes(epistolary_id);
CREATE INDEX idx_auth_codes_user ON auth_codes(user_id);

CREATE TABLE IF NOT EXISTS access_tokens (
  token TEXT PRIMARY KEY,
  epistolary_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  scopes TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_access_tokens_epistolary ON access_tokens(epistolary_id);
CREATE INDEX idx_access_tokens_user ON access_tokens(user_id);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  epistolary_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (epistolary_id) REFERENCES epistolaries(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_epistolary ON refresh_tokens(epistolary_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_access ON refresh_tokens(access_token);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user ON sessions(user_id);