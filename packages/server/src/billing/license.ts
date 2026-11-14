import { base64UrlDecode, base64UrlEncode, hmacSha256, hmacVerify } from '../http.ts';
import { LicenseTokenPayloadSchema } from '../ai/schemas.ts';

export interface LicensePayload {
  plan: 'explorer' | 'researcher' | 'lab';
  customer: string;
  exp: number;
  nonce: string;
}

export type VerifyResult =
  | { ok: true; payload: LicensePayload }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

const encodePayload = (payload: LicensePayload): string =>
  base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

/** token = base64url(payload) + "." + base64url(HMAC-SHA256(secret, payloadPart)) */
export const signLicenseToken = async (payload: LicensePayload, secret: string): Promise<string> => {
  const body = encodePayload(payload);
  const signature = await hmacSha256(secret, body);
  return body + '.' + base64UrlEncode(signature);
};

export const verifyLicenseToken = async (
  token: string,
  secret: string,
  nowSec = Math.floor(Date.now() / 1000),
  allowExpired = false,
): Promise<VerifyResult> => {
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) return { ok: false, reason: 'malformed' };
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: 'malformed' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const zod = LicenseTokenPayloadSchema.safeParse(parsed);
  if (!zod.success) return { ok: false, reason: 'malformed' };
  let signature: Uint8Array;
  try {
    signature = base64UrlDecode(parts[1]);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  const valid = await hmacVerify(secret, parts[0], signature);
  if (!valid) return { ok: false, reason: 'bad-signature' };
  if (zod.data.exp <= nowSec && !allowExpired) return { ok: false, reason: 'expired' };
  return { ok: true, payload: zod.data };
};

export const newNonce = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

export const expiryFromNow = (seconds: number, now = Date.now()): number =>
  Math.floor(now / 1000) + seconds;
