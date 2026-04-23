import { createFileRoute, redirect } from '@tanstack/react-router';
import { useSessionStore } from '@/entities/session';
import { SignInPage } from '@/pages/sign-in';

type SignInSearch = { redirect?: string | undefined };

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search: Record<string, unknown>): SignInSearch => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    const { status, isAuthenticated } = useSessionStore.getState();
    if (status === 'ready' && isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: SignInPage,
});
