import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/entities/session';
import { Lnb } from '@/widgets/lnb';
import { Spinner } from '@/shared/ui';

function sanitizeRedirect(href: string): string | undefined {
  return href.startsWith('/sign-in') ? undefined : href;
}

export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ location }) => {
    const { status, isAuthenticated } = useSessionStore.getState();
    // 부트 중에는 판단을 보류하고 컴포넌트에서 리다이렉트 처리.
    if (status !== 'ready') return;
    if (!isAuthenticated) {
      const target = sanitizeRedirect(location.href);
      throw redirect({
        to: '/sign-in',
        search: target ? { redirect: target } : {},
      });
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
  const hrefRef = useRef(href);
  hrefRef.current = href;
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (didRedirectRef.current) return;
    if (status === 'ready' && !isAuthenticated) {
      didRedirectRef.current = true;
      const target = sanitizeRedirect(hrefRef.current);
      void navigate({
        to: '/sign-in',
        search: target ? { redirect: target } : {},
      });
    }
  }, [status, isAuthenticated, navigate]);

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
