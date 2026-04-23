export const PAGE_SIZE = 20;

export const ACCESS_TTL_MS = 15 * 60_000;
export const REFRESH_TTL_MS = 7 * 24 * 60 * 60_000;

export const DEMO_ACCOUNTS = [
  {
    id: 'demo1',
    email: 'demo1@kbhc.com',
    password: 'password1234',
    name: '김데모',
    memo: '데모 계정 1 - 일반 사용자',
  },
  {
    id: 'demo2',
    email: 'demo2@kbhc.com',
    password: 'password5678',
    name: '박데모',
    memo: '데모 계정 2 - 관리자',
  },
] as const;

export type DemoAccount = (typeof DEMO_ACCOUNTS)[number];
