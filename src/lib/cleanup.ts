import type { Env } from "../types/auth";

export async function cleanupUnverifiedUsers(env: Env): Promise<number> {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const result = await env.DB.prepare(
    "DELETE FROM users WHERE email_verified = 0 AND created_at < ? RETURNING id"
  )
    .bind(oneDayAgo)
    .all();

  return result.results?.length || 0;
}
