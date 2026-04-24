import { env } from '@/shared/config/env';
import type { components } from '@/shared/api/openapi';

type AuthTokenResponse = components['schemas']['AuthTokenResponse'];

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = 'HttpError';
  }
}

type RequestOptions = Omit<RequestInit, 'body' | 'method'> & {
  body?: unknown;
};

// 인증·세션 훅을 entities가 주입한다. shared가 entities에 직접 의존하지 않도록 하기 위함.
type AuthBridge = {
  getAccessToken: () => string | null;
  onRefreshed: (token: string) => void;
  onUnauthorized: () => void;
};

let bridge: AuthBridge = {
  getAccessToken: () => null,
  onRefreshed: () => {},
  onUnauthorized: () => {},
};

export const configureHttp = (next: Partial<AuthBridge>) => {
  bridge = { ...bridge, ...next };
};

const AUTH_FREE_PATHS = ['/api/sign-in', '/api/refresh'];
const isAuthFree = (path: string) => AUTH_FREE_PATHS.some((p) => path.startsWith(p));

// 동시 다발 401 요청이 refresh를 한 번만 호출하도록 공유되는 in-flight promise.
let refreshPromise: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const response = await fetch(`${env.API_BASE_URL}/api/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) return null;
  const tokens = (await response.json()) as AuthTokenResponse | null;
  return tokens?.accessToken ?? null;
}

async function ensureRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = runRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function buildInit(method: string, options: RequestOptions, token: string | null): RequestInit {
  const { body, headers, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include',
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return init;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${env.API_BASE_URL}${path}`;
  const authFree = isAuthFree(path);

  let response = await fetch(
    url,
    buildInit(method, options, authFree ? null : bridge.getAccessToken()),
  );

  if (response.status === 401 && !authFree) {
    const nextToken = await ensureRefresh();
    if (nextToken) {
      bridge.onRefreshed(nextToken);
      response = await fetch(url, buildInit(method, options, nextToken));
    } else {
      bridge.onUnauthorized();
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new HttpError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>('POST', path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>('DELETE', path, options),
};
