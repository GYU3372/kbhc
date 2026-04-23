import { useInfiniteQuery } from '@tanstack/react-query';
import { Link, useElementScrollRestoration } from '@tanstack/react-router';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircledIcon, CircleIcon } from '@radix-ui/react-icons';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { taskQueries } from '@/entities/task';
import type { TaskItem } from '@/entities/task';
import { Card, EmptyState, Spinner } from '@/shared/ui';

const ROW_ESTIMATE = 116;
export const TASK_LIST_SCROLL_RESTORATION_ID = 'task-list';

type TaskListProps = {
  scrollElement: HTMLElement | null;
};

export function TaskList({ scrollElement }: TaskListProps) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

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

  const scrollEntry = useElementScrollRestoration({
    id: TASK_LIST_SCROLL_RESTORATION_ID,
  });

  useLayoutEffect(() => {
    const listElement = listRef.current;
    if (!scrollElement || !listElement) return;

    const updateScrollMargin = () => {
      const scrollTop = scrollElement.getBoundingClientRect().top;
      const listTop = listElement.getBoundingClientRect().top;
      setScrollMargin(Math.max(0, listTop - scrollTop + scrollElement.scrollTop));
    };

    updateScrollMargin();

    const observer = new ResizeObserver(updateScrollMargin);
    observer.observe(scrollElement);
    observer.observe(listElement);
    window.addEventListener('resize', updateScrollMargin);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScrollMargin);
    };
  }, [items.length, scrollElement]);

  const virtualizer = useVirtualizer({
    count: items.length + (canLoadMore ? 1 : 0),
    getScrollElement: () => scrollElement,
    getItemKey: (index) => items[index]?.id ?? `loader-${index}`,
    estimateSize: () => ROW_ESTIMATE,
    enabled: scrollElement !== null,
    initialOffset: () => scrollEntry?.scrollY ?? 0,
    overscan: 6,
    scrollMargin,
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
        { root: scrollElement, rootMargin: '200px' },
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [canLoadMore, isFetchingNextPage, fetchNextPage, scrollElement],
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
      ref={listRef}
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualItems.map((virtualRow) => {
          const isSentinel = virtualRow.index >= items.length;
          const task = items[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute left-0 top-0 box-border w-full px-1 py-1.5"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              {isSentinel ? (
                <div
                  ref={sentinelRef}
                  className="flex h-full items-center justify-center text-sm text-text-secondary"
                >
                  {isFetchingNextPage ? '불러오는 중…' : ' '}
                </div>
              ) : task ? (
                <Link
                  to="/task/$id"
                  params={{ id: task.id }}
                  className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Card interactive className="h-full overflow-hidden">
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
