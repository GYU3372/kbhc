import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';
import { useSessionStore } from '@/entities/session';
import { Lnb } from '@/widgets/lnb';
import { Spinner } from '@/shared/ui';

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ location }) => {
    const { status, isAuthenticated } = useSessionStore.getState();
    // 부트 중에는 판단을 보류하고 컴포넌트에서 리다이렉트 처리.
    if (status !== 'ready') return;
    if (!isAuthenticated) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const status = useSessionStore((state) => state.status);
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);
  const isRouterLoading = useRouterState({ select: (s) => s.isLoading });
  const navigate = useNavigate();
  const href = useRouterState({ select: (s) => s.location.href });

  useEffect(() => {
    if (status === 'ready' && !isAuthenticated) {
      void navigate({ to: '/sign-in', search: { redirect: href } });
    }
  }, [status, isAuthenticated, href, navigate]);

  if (status !== 'ready' || isRouterLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="세션 확인 중" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1">
      <Lnb />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
