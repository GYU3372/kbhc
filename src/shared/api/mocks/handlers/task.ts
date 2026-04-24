import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/openapi';
import { verifyAccess } from '../auth';
import { PAGE_SIZE } from '../constants';
import { db } from '../db';

type TaskListResponse = components['schemas']['TaskListResponse'];
type TaskDetailResponse = components['schemas']['TaskDetailResponse'];
type DeleteTaskResponse = components['schemas']['DeleteTaskResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];

type TaskIdParams = { id: string };

const unauthorized = () =>
  HttpResponse.json<ErrorResponse>({ errorMessage: 'Unauthorized' }, { status: 401 });

const notFound = () =>
  HttpResponse.json<ErrorResponse>(
    { errorMessage: 'Task를 찾을 수 없습니다.' },
    { status: 404 },
  );

const badRequest = (message: string) =>
  HttpResponse.json<ErrorResponse>({ errorMessage: message }, { status: 400 });

const TASK_EPOCH = Date.UTC(2025, 0, 1);
const HOUR_MS = 60 * 60_000;

const computeRegisterDatetime = (taskId: string): string => {
  const index = db.tasks.indexOf(taskId);
  const safeIndex = index >= 0 ? index : 0;
  return new Date(TASK_EPOCH + safeIndex * HOUR_MS).toISOString();
};

export const taskHandlers = [
  http.get<never, never, TaskListResponse | ErrorResponse>('/api/task', ({ request }) => {
    const verified = verifyAccess(request);
    if (!verified.ok) return unauthorized();

    const url = new URL(request.url);
    const pageParam = url.searchParams.get('page');
    if (pageParam === null) {
      return badRequest('page 파라미터가 필요합니다.');
    }
    const parsed = Number(pageParam);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return badRequest('page는 1 이상의 정수여야 합니다.');
    }

    return HttpResponse.json(db.tasks.list(parsed, PAGE_SIZE));
  }),

  http.get<TaskIdParams, never, TaskDetailResponse | ErrorResponse>(
    '/api/task/:id',
    ({ request, params }) => {
      const verified = verifyAccess(request);
      if (!verified.ok) return unauthorized();

      const task = db.tasks.get(params.id);
      if (!task) return notFound();

      return HttpResponse.json({
        title: task.title,
        memo: task.memo,
        registerDatetime: computeRegisterDatetime(params.id),
      });
    },
  ),

  http.delete<TaskIdParams, never, DeleteTaskResponse | ErrorResponse>(
    '/api/task/:id',
    ({ request, params }) => {
      const verified = verifyAccess(request);
      if (!verified.ok) return unauthorized();

      if (!db.tasks.delete(params.id)) return notFound();

      return HttpResponse.json({ success: true });
    },
  ),
];
