import { http } from '@/shared/api/http';
import type { TaskDetailResponse } from '../model/task';

export const getTaskDetail = (id: string) =>
  http.get<TaskDetailResponse>(`/api/task/${id}`);
