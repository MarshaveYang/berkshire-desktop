// 单密码认证：登录成功后签发一个 HMAC 签名的 cookie（不是 JWT，够用且没有额外依赖）。
// cookie 内容: `${expiresAtMs}.${signatureHex}`
// 签名 = HMAC-SHA256(secret, expiresAtMs) —— 只要密钥不泄露，攻击者无法伪造。

const COOKIE_NAME = "bkd_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 天

async function hmacSign(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const sig = await hmacSign(secret, String(expiresAt));
  const value = `${expiresAt}.${sig}`;
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function isAuthenticated(request: Request, secret: string): Promise<boolean> {
  const raw = getCookie(request, COOKIE_NAME);
  if (!raw) return false;
  const [expiresAtStr, sig] = raw.split(".");
  if (!expiresAtStr || !sig) return false;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  const expectedSig = await hmacSign(secret, expiresAtStr);
  return timingSafeEqual(sig, expectedSig);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
