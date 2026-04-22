import { ErrorBoundary as ReactErrorBoundary, type FallbackProps } from 'react-error-boundary';
import type { ReactNode } from 'react';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 font-sans">
      <p>문제가 발생했습니다.</p>
      <pre className="mt-2 text-sm text-[color:var(--color-danger)]">{String(error)}</pre>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-4 rounded border px-3 py-1"
      >
        다시 시도
      </button>
    </div>
  );
}

type AppErrorBoundaryProps = {
  children: ReactNode;
};

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return <ReactErrorBoundary FallbackComponent={Fallback}>{children}</ReactErrorBoundary>;
}
