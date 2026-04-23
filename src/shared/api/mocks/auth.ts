import { ACCESS_TTL_MS, REFRESH_TTL_MS } from './constants';
import { recallRefreshToken } from './cookie-jar';

type JwtPayload = { id: string; exp: number };

const b64urlEncode = (value: string) =>
  btoa(value).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

const b64urlDecode = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (padded.length % 4)) % 4);
  return atob(padded + padding);
};

const mkJwt = (id: string, ttlMs: number) => {
  const header = b64urlEncode(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = b64urlEncode(
    JSON.stringify({ id, exp: Math.floor((Date.now() + ttlMs) / 1000) }),
  );
  return `${header}.${payload}.sig`;
};

const parseJwt = (token: string): JwtPayload | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payloadPart = parts[1];
  if (!payloadPart) return null;
  try {
    const decoded = JSON.parse(b64urlDecode(payloadPart)) as unknown;
    if (
      typeof decoded === 'object' &&
      decoded !== null &&
      'id' in decoded &&
      'exp' in decoded &&
      typeof (decoded as JwtPayload).id === 'string' &&
      typeof (decoded as JwtPayload).exp === 'number'
    ) {
      return decoded as JwtPayload;
    }
    return null;
  } catch {
    return null;
  }
};

const isLive = (payload: JwtPayload | null): payload is JwtPayload =>
  payload !== null && payload.exp > Math.floor(Date.now() / 1000);

export const issueTokens = (userId: string) => ({
  accessToken: mkJwt(userId, ACCESS_TTL_MS),
  refreshToken: mkJwt(userId, REFRESH_TTL_MS),
});

type VerifyResult = { ok: true; userId: string } | { ok: false };

export const verifyAccess = (request: Request): VerifyResult => {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return { ok: false };
  const payload = parseJwt(header.slice('Bearer '.length));
  if (!isLive(payload)) return { ok: false };
  return { ok: true, userId: payload.id };
};

export const verifyRefresh = (request: Request): VerifyResult => {
  const cookie = request.headers.get('Cookie') ?? '';
  const match = /(?:^|;\s*)token=([^;]+)/.exec(cookie);
  const tokenValue = match?.[1] ?? recallRefreshToken();
  if (!tokenValue) return { ok: false };
  const payload = parseJwt(tokenValue);
  if (!isLive(payload)) return { ok: false };
  return { ok: true, userId: payload.id };
};
