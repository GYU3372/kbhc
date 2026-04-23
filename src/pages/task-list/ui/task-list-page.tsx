import { TaskList } from '@/widgets/task-list';

export function TaskListPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-text-primary">할 일</h1>
      <TaskList />
    </main>
  );
}
