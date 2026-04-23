import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
  label?: string;
}

const sizePx: Record<SpinnerSize, number> = { sm: 16, md: 24, lg: 40 };

export const Spinner = forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = 'md', label = '로딩 중', ...props }, ref) => {
    const px = sizePx[size];
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn('inline-flex items-center justify-center text-text-secondary', className)}
        {...props}
      >
        <svg
          width={px}
          height={px}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="animate-spin"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">{label}</span>
      </div>
    );
  },
);
Spinner.displayName = 'Spinner';
