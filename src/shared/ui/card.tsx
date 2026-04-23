import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * hover/focus-visible 스타일을 켠다. 호출측은 실제 상호작용 접근성을 위해
   * `role="button"`, `tabIndex={0}`, 키보드 핸들러(`onKeyDown`)를 함께 넘기거나
   * `<a>` / Router `<Link>`로 감싸야 한다.
   */
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-disabled bg-surface p-4',
        interactive &&
          'cursor-pointer transition-colors hover:bg-disabled/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';
