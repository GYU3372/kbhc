import { http } from '@/shared/api/http';
import type { components } from '@/shared/api/openapi';

type DeleteTaskResponse = components['schemas']['DeleteTaskResponse'];

export const deleteTask = (id: string) =>
  http.delete<DeleteTaskResponse>(`/api/task/${id}`);
