import type { QueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/entities/session';

// 세션 전환(로그아웃 · refresh 실패 · 동일 탭 유저 교체) 시 비워야 할 상태 전부를 한 곳에서 정의.
// call site는 이 함수만 호출하고, 엔티티가 추가될 때도 이 파일만 손본다.
export const resetSession = (queryClient: QueryClient) => {
  useSessionStore.getState().clear();
  queryClient.clear();
};
