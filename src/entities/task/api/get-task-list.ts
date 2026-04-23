import { http } from '@/shared/api/http';
import type { TaskListResponse } from '../model/task';

export const getTaskList = (page: number) =>
  http.get<TaskListResponse>(`/api/task?page=${page}`);
