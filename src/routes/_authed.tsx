import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed')({
  // TODO(Phase 02+): beforeLoad에서 session 스토어 확인 후 비로그인이면 /sign-in 리다이렉트
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}
