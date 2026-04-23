import { DashboardIcon, ListBulletIcon } from '@radix-ui/react-icons';
import { Link } from '@tanstack/react-router';

import { cn } from '@/shared/lib/cn';

type NavItem = {
  to: string;
  label: string;
  Icon: typeof DashboardIcon;
  exact?: boolean;
};

const items: NavItem[] = [
  { to: '/', label: '대시보드', Icon: DashboardIcon, exact: true },
  { to: '/task', label: '할 일', Icon: ListBulletIcon },
];

export function Lnb() {
  return (
    <aside
      aria-label="기능 내비게이션"
      className="shrink-0 border-r border-disabled bg-surface py-4"
    >
      <ul className="flex flex-col gap-1 px-2">
        {items.map(({ to, label, Icon, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: exact ?? false }}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-md md:w-auto md:justify-start md:gap-2 md:px-3',
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
              <span className="sr-only md:not-sr-only md:text-sm md:font-medium">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
