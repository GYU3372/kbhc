import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/openapi';
import { issueTokens, verifyRefresh } from '../auth';
import { DEMO_ACCOUNTS, REFRESH_TTL_MS } from '../constants';

type SignInRequest = components['schemas']['SignInRequest'];
type AuthTokenResponse = components['schemas']['AuthTokenResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type AuthResponseBody = AuthTokenResponse | ErrorResponse;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^[A-Za-z0-9]{8,24}$/;

const setRefreshCookie = (refreshToken: string) =>
  `token=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(REFRESH_TTL_MS / 1000)}`;

export const authHandlers = [
  http.post<never, SignInRequest, AuthResponseBody>('/api/sign-in', async ({ request }) => {
    const body = await request.json();

    if (!EMAIL_RE.test(body.email) || !PASSWORD_RE.test(body.password)) {
      return HttpResponse.json(
        { errorMessage: '이메일 또는 비밀번호 형식이 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const account = DEMO_ACCOUNTS.find(
      (candidate) => candidate.email === body.email && candidate.password === body.password,
    );
    if (!account) {
      return HttpResponse.json(
        { errorMessage: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 400 },
      );
    }

    const tokens = issueTokens(account.id);
    return HttpResponse.json(tokens, {
      headers: { 'Set-Cookie': setRefreshCookie(tokens.refreshToken) },
    });
  }),

  http.post<never, never, AuthResponseBody>('/api/refresh', ({ request }) => {
    const verified = verifyRefresh(request);
    if (!verified.ok) {
      return HttpResponse.json(
        { errorMessage: 'refresh token이 유효하지 않습니다.' },
        { status: 401 },
      );
    }
    const tokens = issueTokens(verified.userId);
    return HttpResponse.json(tokens, {
      headers: { 'Set-Cookie': setRefreshCookie(tokens.refreshToken) },
    });
  }),
];
