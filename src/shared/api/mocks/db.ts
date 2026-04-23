import type { components } from '@/shared/api/openapi';
import { seedTasks } from './seeds';

type TaskItem = components['schemas']['TaskItem'];
type TaskStatus = TaskItem['status'];

const tasks = new Map<string, TaskItem>();
seedTasks(300).forEach((task) => {
  tasks.set(task.id, task);
});

export const db = {
  tasks: {
    list(page: number, size: number) {
      const all = Array.from(tasks.values());
      const start = (page - 1) * size;
      const slice = all.slice(start, start + size);
      return { data: slice, hasNext: start + size < all.length };
    },
    get(id: string): TaskItem | null {
      return tasks.get(id) ?? null;
    },
    delete(id: string): boolean {
      return tasks.delete(id);
    },
    count(): number {
      return tasks.size;
    },
    countByStatus(status: TaskStatus): number {
      let n = 0;
      for (const task of tasks.values()) {
        if (task.status === status) n += 1;
      }
      return n;
    },
    indexOf(id: string): number {
      return Array.from(tasks.keys()).indexOf(id);
    },
  },
};
