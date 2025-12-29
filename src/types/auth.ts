export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  SESSION_DURATION: string;
  AUTH_CODE_DURATION: string;
  ACCESS_TOKEN_DURATION: string;
  REFRESH_TOKEN_DURATION: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  APP_URL: string;
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITE_KEY2: string;
  TURNSTILE_SECRET_KEY2: string;
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  email_verified: number;
  email_verification_token?: string;
  email_verification_expires?: number;
  last_verification_email_sent?: number;
  verification_email_count?: number;
  totp_secret?: string;
  totp_enabled?: number;
  two_factor_email_enabled?: number;
  backup_codes?: string;
  pending_email?: string;
  pending_email_token?: string;
  pending_email_expires?: number;
  last_2fa_code_sent?: number;
  twofa_code_count?: number;
  created_at: number;
  updated_at: number;
}

export interface Epistolary {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  redirect_uris: string;
  client_secret: string;
  logo_url?: string;
  website_url?: string;
  scopes: string;
  active: number;
  created_at: number;
  updated_at: number;
}

export interface AuthCode {
  code: string;
  epistolary_id: string;
  user_id: string;
  redirect_uri: string;
  scopes: string;
  expires_at: number;
  used: number;
  created_at: number;
}

export interface AccessToken {
  token: string;
  epistolary_id: string;
  user_id: string;
  scopes: string;
  expires_at: number;
  created_at: number;
}

export interface RefreshToken {
  token: string;
  access_token: string;
  epistolary_id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: number;
  created_at: number;
}
