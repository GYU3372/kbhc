import { queryOptions } from '@tanstack/react-query';
import { getDashboard } from './get-dashboard';

export const dashboardQueries = {
  all: () => ['dashboard'] as const,
  summary: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), 'summary'] as const,
      queryFn: getDashboard,
    }),
};
