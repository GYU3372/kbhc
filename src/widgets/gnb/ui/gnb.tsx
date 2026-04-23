import { EnterIcon, PersonIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';

import { useSessionStore } from '@/entities/session';
import { cn } from '@/shared/lib/cn';

export function Gnb() {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  const authLink = isAuthenticated
    ? { to: '/user', label: '회원정보', Icon: PersonIcon }
    : { to: '/sign-in', label: '로그인', Icon: EnterIcon };

  const { to, label, Icon } = authLink;

  return (
    <header className="border-b border-disabled bg-surface">
      <nav
        aria-label="사용자 내비게이션"
        className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3"
      >
        <Link
          to="/"
          className={cn(
            'mr-auto rounded-md px-1 text-sm font-semibold text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            'hover:text-text-secondary',
          )}
          aria-label="홈으로 이동"
        >
          KBHC Tasks
        </Link>
        <Link
          to={to}
          aria-label={label}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-md',
            'text-text-secondary transition-colors',
            'hover:bg-disabled hover:text-text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          )}
          activeProps={{
            className: 'bg-disabled text-text-primary',
            'aria-current': 'page',
          }}
        >
          <Icon aria-hidden="true" width={20} height={20} />
        </Link>
      </nav>
    </header>
  );
}
