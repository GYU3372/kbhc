/* eslint-disable react-refresh/only-export-components --
 * Radix Dialog 분해 export 패턴상 이 파일은 `Modal` 네임스페이스 객체를 export 한다.
 * react-refresh 규칙은 "파일이 컴포넌트만 export" 해야 HMR을 보장하지만, 본 파일은
 * 객체 export + 여러 하위 컴포넌트 선언이 공존하므로 규칙과 구조적으로 상충한다.
 * 편집 시 full-reload가 발생할 수 있는 trade-off를 수용한다.
 */
import * as Dialog from '@radix-ui/react-dialog';
import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from 'react';

import { cn } from '@/shared/lib/cn';

type OverlayProps = ComponentPropsWithoutRef<typeof Dialog.Overlay>;

const Overlay = forwardRef<ElementRef<typeof Dialog.Overlay>, OverlayProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/40 transition-opacity',
        'motion-reduce:transition-none',
        'data-[state=closed]:opacity-0',
        className,
      )}
      {...props}
    />
  ),
);
Overlay.displayName = 'ModalOverlay';

type ContentProps = ComponentPropsWithoutRef<typeof Dialog.Content>;

const Content = forwardRef<ElementRef<typeof Dialog.Content>, ContentProps>(
  ({ className, children, ...props }, ref) => (
    <Dialog.Portal>
      <Overlay />
      <Dialog.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md',
          '-translate-x-1/2 -translate-y-1/2',
          'max-h-[calc(100dvh-2rem)] overflow-auto',
          'rounded-lg border border-disabled bg-surface p-6 shadow-lg',
          'focus:outline-none',
          'transition-[opacity,transform] duration-150',
          'motion-reduce:transition-none',
          'data-[state=closed]:opacity-0 data-[state=closed]:scale-95',
          'motion-reduce:data-[state=closed]:scale-100',
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  ),
);
Content.displayName = 'ModalContent';

type TitleProps = ComponentPropsWithoutRef<typeof Dialog.Title>;

const Title = forwardRef<ElementRef<typeof Dialog.Title>, TitleProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Title
      ref={ref}
      className={cn('text-lg font-semibold text-text-primary', className)}
      {...props}
    />
  ),
);
Title.displayName = 'ModalTitle';

type DescriptionProps = ComponentPropsWithoutRef<typeof Dialog.Description>;

const Description = forwardRef<ElementRef<typeof Dialog.Description>, DescriptionProps>(
  ({ className, ...props }, ref) => (
    <Dialog.Description
      ref={ref}
      className={cn('mt-1.5 text-sm text-text-secondary', className)}
      {...props}
    />
  ),
);
Description.displayName = 'ModalDescription';

type FooterProps = HTMLAttributes<HTMLDivElement>;

const Footer = forwardRef<HTMLDivElement, FooterProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
));
Footer.displayName = 'ModalFooter';

export const Modal = {
  Root: Dialog.Root,
  Trigger: Dialog.Trigger,
  Close: Dialog.Close,
  Content,
  Title,
  Description,
  Footer,
};
