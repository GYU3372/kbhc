import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';
import { Button } from '@/shared/ui';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 font-sans">
      <p>문제가 발생했습니다.</p>
      <pre className="mt-2 text-sm text-[color:var(--color-danger)]">{String(error)}</pre>
      <Button variant="ghost" onClick={resetErrorBoundary} className="mt-4">
        다시 시도
      </Button>
    </div>
  );
}

type AppErrorBoundaryProps = {
  children: ReactNode;
};

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return <ReactErrorBoundary FallbackComponent={Fallback}>{children}</ReactErrorBoundary>;
}
