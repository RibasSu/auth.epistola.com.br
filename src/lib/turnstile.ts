import type { Env } from "../types/auth";

export async function verifyTurnstile(
  token: string,
  env: Env,
  ip?: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = (await response.json()) as { success: boolean };
    return data.success;
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return false;
  }
}

export async function verifyTurnstileNonInteractive(
  token: string,
  env: Env,
  ip?: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET_KEY2);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = (await response.json()) as { success: boolean };
    return data.success;
  } catch (error) {
    console.error("Turnstile Non-interactive verification error:", error);
    return false;
  }
}
