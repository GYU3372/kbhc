import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/openapi';
import { verifyAccess } from '../auth';
import { db } from '../db';

type DashboardResponse = components['schemas']['DashboardResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type DashboardResponseBody = DashboardResponse | ErrorResponse;

export const dashboardHandlers = [
  http.get<never, never, DashboardResponseBody>('/api/dashboard', ({ request }) => {
    const verified = verifyAccess(request);
    if (!verified.ok) {
      return HttpResponse.json({ errorMessage: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({
      numOfTask: db.tasks.count(),
      numOfRestTask: db.tasks.countByStatus('TODO'),
      numOfDoneTask: db.tasks.countByStatus('DONE'),
    });
  }),
];
