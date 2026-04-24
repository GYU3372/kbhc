import { useState } from 'react';
import { useDocumentTitle } from '@/shared/lib/use-document-title';
import { TaskList, TASK_LIST_SCROLL_RESTORATION_ID } from '@/widgets/task-list';

export function TaskListPage() {
  useDocumentTitle('할 일');
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  return (
    <main
      ref={setScrollElement}
      data-scroll-restoration-id={TASK_LIST_SCROLL_RESTORATION_ID}
      className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-8"
    >
      <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4">
        <h1 className="text-xl font-semibold text-text-primary">할 일</h1>
        <TaskList scrollElement={scrollElement} />
      </div>
    </main>
  );
}
