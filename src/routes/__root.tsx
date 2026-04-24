import { Outlet, createRootRoute } from '@tanstack/react-router';
import { NotFoundPage } from '@/pages/not-found';
import { Gnb } from '@/widgets/gnb';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
});

function RootLayout() {
  return (
    <div className="flex h-dvh flex-col">
      <Gnb />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
