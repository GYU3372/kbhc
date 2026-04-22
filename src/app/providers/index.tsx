import type { ReactNode } from 'react';
import { AppErrorBoundary } from './error-boundary';
import { QueryProvider } from './query-provider';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <AppErrorBoundary>
      <QueryProvider>{children}</QueryProvider>
    </AppErrorBoundary>
  );
}
