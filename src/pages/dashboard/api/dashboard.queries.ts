import { queryOptions } from '@tanstack/react-query';
import { http } from '@/shared/api/http';
import type { components } from '@/shared/api/openapi';

type DashboardResponse = components['schemas']['DashboardResponse'];

const getDashboard = () => http.get<DashboardResponse>('/api/dashboard');

export const dashboardQueries = {
  all: () => ['dashboard'] as const,
  summary: () =>
    queryOptions({
      queryKey: [...dashboardQueries.all(), 'summary'] as const,
      queryFn: getDashboard,
    }),
};
