import { http } from '@/shared/api/http';
import type { components } from '@/shared/api/openapi';

export type AuthTokenResponse = components['schemas']['AuthTokenResponse'];

export const refreshSession = () => http.post<AuthTokenResponse>('/api/refresh');
