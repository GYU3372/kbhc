import type { ReactNode } from 'react';
import { AppErrorBoundary } from './error-boundary';
import { QueryProvider } from './query-provider';
import { SessionProvider } from './session-provider';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <AppErrorBoundary>
      <QueryProvider>
        <SessionProvider>{children}</SessionProvider>
      </QueryProvider>
    </AppErrorBoundary>
  );
}
