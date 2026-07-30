// Signed, tamper-proof OAuth state helpers + origin allowlist for Strava OAuth.

const encoder = new TextEncoder();

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const fromB64url = (s: string) => {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

async function key(secret: string) {
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function sign(payload: string, secret: string) {
  const sig = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(payload));
  return b64url(new Uint8Array(sig));
}

export interface StravaState {
  u: string;
  o: string;
  n: string;
  t: number;
}

const STATE_TTL_MS = 10 * 60 * 1000;

export function isAllowedOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
    return true;
  }
  if (url.protocol !== "https:") return false;
  const host = url.hostname;
  const allowedSuffixes = [".lovable.app", ".lovableproject.com", ".lovable.dev"];
  if (allowedSuffixes.some((s) => host.endsWith(s))) return true;
  const extra = (Deno.env.get("STRAVA_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return extra.includes(url.origin);
}

/** Normalizes an origin string to scheme://host[:port], dropping any path/query. */
export function normalizeOrigin(origin: string): string | null {
  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

export async function encodeState(userId: string, origin: string, secret: string): Promise<string> {
  const state: StravaState = {
    u: userId,
    o: origin,
    n: b64url(crypto.getRandomValues(new Uint8Array(16))),
    t: Date.now(),
  };
  const payload = b64url(encoder.encode(JSON.stringify(state)));
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyState(raw: string, secret: string): Promise<StravaState | null> {
  const parts = raw.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = await sign(payload, secret);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;

  let state: StravaState;
  try {
    state = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  } catch {
    return null;
  }
  if (!state?.u || !state?.o || !state?.n || typeof state.t !== "number") return null;
  if (Date.now() - state.t > STATE_TTL_MS) return null;
  if (!isAllowedOrigin(state.o)) return null;
  return state;
}

export const escapeHtml = (s: unknown) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");