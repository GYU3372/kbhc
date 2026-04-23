// MSW가 응답한 `Set-Cookie`를 브라우저가 Service Worker 응답이라는 이유로 저장하지 않는
// 경우가 있어(특히 HttpOnly), 목업 레이어 안에서 refresh 토큰을 localStorage에 함께
// 보관한다. 실 백엔드 httpOnly 쿠키(Max-Age 기반 영속)와 동일한 UX를 내기 위해
// localStorage를 선택했고, 만료는 JWT exp 검사(`isLive`)에 맡긴다. MSW 목업 전용이다.

const STORAGE_KEY = 'msw.refresh-token';

const storage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const rememberRefreshToken = (token: string) => {
  storage()?.setItem(STORAGE_KEY, token);
};

export const forgetRefreshToken = () => {
  storage()?.removeItem(STORAGE_KEY);
};

export const recallRefreshToken = (): string | null => storage()?.getItem(STORAGE_KEY) ?? null;
