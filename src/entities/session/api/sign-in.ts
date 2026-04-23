import { http } from '@/shared/api/http';
import type { components } from '@/shared/api/openapi';

export type SignInRequest = components['schemas']['SignInRequest'];
export type AuthTokenResponse = components['schemas']['AuthTokenResponse'];

export const signIn = (body: SignInRequest) =>
  http.post<AuthTokenResponse>('/api/sign-in', { body });
