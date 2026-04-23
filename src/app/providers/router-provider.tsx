import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routes/routeTree.gen';

const router = createRouter({
  routeTree,
  scrollRestoration: true,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
