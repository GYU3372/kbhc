import { QueryClient } from '@tanstack/react-query';
import { HttpError } from './http';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof HttpError && error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
