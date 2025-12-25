export function generateTOTPSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const length = 32;
  let secret = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    secret += chars[randomBytes[i]! % chars.length];
  }
  return secret;
}

function base32Decode(secret: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanSecret = secret.replace(/=+$/, "").toUpperCase();
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleanSecret.length; i++) {
    const char = cleanSecret[i];
    if (!char) continue;
    const idx = chars.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

async function hmacSha1(
  key: Uint8Array,
  data: Uint8Array
): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    data.buffer as ArrayBuffer
  );
  return new Uint8Array(signature);
}

export async function generateTOTP(
  secret: string,
  timeStep: number = 30
): Promise<string> {
  const time = Math.floor(Date.now() / 1000);
  const counter = Math.floor(time / timeStep);

  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setBigUint64(0, BigInt(counter), false);

  const key = base32Decode(secret);
  const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));

  const offset = hmac[hmac.length - 1]! & 0xf;
  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  const otp = (code % 1000000).toString().padStart(6, "0");
  return otp;
}

export async function verifyTOTP(
  secret: string,
  token: string,
  window: number = 1
): Promise<boolean> {
  for (let i = -window; i <= window; i++) {
    const time = Math.floor(Date.now() / 1000) + i * 30;
    const counter = Math.floor(time / 30);

    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setBigUint64(0, BigInt(counter), false);

    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, new Uint8Array(counterBuffer));

    const offset = hmac[hmac.length - 1]! & 0xf;
    const code =
      ((hmac[offset]! & 0x7f) << 24) |
      ((hmac[offset + 1]! & 0xff) << 16) |
      ((hmac[offset + 2]! & 0xff) << 8) |
      (hmac[offset + 3]! & 0xff);

    const otp = (code % 1000000).toString().padStart(6, "0");

    if (otp === token) {
      return true;
    }
  }
  return false;
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (let i = 0; i < count; i++) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(8));
    let code = "";
    for (let j = 0; j < 8; j++) {
      code += chars[randomBytes[j]! % chars.length];
    }
    codes.push(code);
  }

  return codes;
}

export function generate2FAEmailCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const randomBytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[randomBytes[i]! % chars.length];
  }
  return code;
}

export function generateOTPAuthURL(
  secret: string,
  email: string,
  issuer: string = "Epístola Auth"
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(
    email
  )}?${params.toString()}`;
}
