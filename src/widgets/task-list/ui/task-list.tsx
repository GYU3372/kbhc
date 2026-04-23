import { useInfiniteQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircledIcon, CircleIcon } from '@radix-ui/react-icons';
import { useCallback, useRef } from 'react';
import { taskQueries } from '@/entities/task';
import type { TaskItem } from '@/entities/task';
import { Card, EmptyState, Spinner } from '@/shared/ui';

const ROW_ESTIMATE = 96;

export function TaskList() {
  const parentRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery(taskQueries.infiniteList());

  const items: TaskItem[] = data?.pages.flatMap((page) => page.data) ?? [];
  const canLoadMore = hasNextPage ?? false;

  const virtualizer = useVirtualizer({
    count: items.length + (canLoadMore ? 1 : 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_ESTIMATE,
    overscan: 6,
  });

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !canLoadMore) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !isFetchingNextPage) {
            void fetchNextPage();
          }
        },
        { root: parentRef.current, rootMargin: '200px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [canLoadMore, isFetchingNextPage, fetchNextPage],
  );

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Spinner label="할 일 목록 불러오는 중" />
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="p-4 text-sm text-danger">
        할 일 목록을 불러오지 못했습니다.
      </p>
    );
  }

  if (items.length === 0) {
    return <EmptyState title="할 일이 없습니다" />;
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto"
      style={{ maxHeight: 'calc(100dvh - 10rem)' }}
    >
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const isSentinel = virtualRow.index >= items.length;
          const task = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 top-0 w-full px-1 py-1.5"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {isSentinel ? (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center py-3 text-sm text-text-secondary"
                >
                  {isFetchingNextPage ? '불러오는 중…' : ' '}
                </div>
              ) : task ? (
                <Link
                  to="/task/$id"
                  params={{ id: task.id }}
                  className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Card interactive>
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 shrink-0" aria-hidden>
                        {task.status === 'DONE' ? (
                          <CheckCircledIcon className="h-5 w-5 text-primary" />
                        ) : (
                          <CircleIcon className="h-5 w-5 text-text-secondary" />
                        )}
                      </span>
                      <span className="sr-only">
                        {task.status === 'DONE' ? '완료' : '해야 할 일'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium text-text-primary">
                          {task.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                          {task.memo}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
