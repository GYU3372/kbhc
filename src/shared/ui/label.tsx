import * as RadixLabel from '@radix-ui/react-label';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';

import { cn } from '@/shared/lib/cn';

type LabelProps = ComponentPropsWithoutRef<typeof RadixLabel.Root>;

export const Label = forwardRef<ElementRef<typeof RadixLabel.Root>, LabelProps>(
  ({ className, ...props }, ref) => (
    <RadixLabel.Root
      ref={ref}
      className={cn('text-sm font-medium text-text-primary', className)}
      {...props}
    />
  ),
);
Label.displayName = 'Label';
