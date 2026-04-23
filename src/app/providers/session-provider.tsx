import { useEffect, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession, resetSession, useSessionStore } from '@/entities/session';
import { configureHttp } from '@/shared/api/http';

type SessionProviderProps = {
  children: ReactNode;
};

export function SessionProvider({ children }: SessionProviderProps) {
  const queryClient = useQueryClient();
  const didBootstrap = useRef(false);

  useEffect(() => {
    configureHttp({
      getAccessToken: () => useSessionStore.getState().accessToken,
      onRefreshed: (token) => useSessionStore.getState().setAccessToken(token),
      onUnauthorized: () => resetSession(queryClient),
    });

    if (didBootstrap.current) return;
    didBootstrap.current = true;

    const { setAccessToken, setStatus } = useSessionStore.getState();
    setStatus('bootstrapping');

    (async () => {
      try {
        const tokens = await refreshSession();
        setAccessToken(tokens.accessToken);
      } catch {
        useSessionStore.getState().clear();
      } finally {
        setStatus('ready');
      }
    })();
  }, [queryClient]);

  return <>{children}</>;
}
