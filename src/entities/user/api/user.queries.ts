import { queryOptions } from '@tanstack/react-query';
import { getUser } from './get-user';

export const userQueries = {
  all: () => ['user'] as const,
  details: () => [...userQueries.all(), 'detail'] as const,
  me: () =>
    queryOptions({
      queryKey: [...userQueries.details(), 'me'] as const,
      queryFn: getUser,
    }),
};
