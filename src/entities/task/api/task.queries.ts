import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { getTaskDetail } from './get-task-detail';
import { getTaskList } from './get-task-list';

export const taskQueries = {
  all: () => ['task'] as const,
  lists: () => [...taskQueries.all(), 'list'] as const,
  infiniteList: () =>
    infiniteQueryOptions({
      queryKey: [...taskQueries.lists(), 'infinite'] as const,
      queryFn: ({ pageParam }) => getTaskList(pageParam),
      initialPageParam: 1,
      getNextPageParam: (last, _all, lastParam) =>
        last.hasNext ? lastParam + 1 : undefined,
    }),
  details: () => [...taskQueries.all(), 'detail'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...taskQueries.details(), id] as const,
      queryFn: () => getTaskDetail(id),
    }),
};
