import { http, HttpResponse } from 'msw';
import type { components } from '@/shared/api/openapi';
import { verifyAccess } from '../auth';
import { DEMO_ACCOUNTS } from '../constants';

type UserResponse = components['schemas']['UserResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type UserResponseBody = UserResponse | ErrorResponse;

export const userHandlers = [
  http.get<never, never, UserResponseBody>('/api/user', ({ request }) => {
    const verified = verifyAccess(request);
    if (!verified.ok) {
      return HttpResponse.json({ errorMessage: 'Unauthorized' }, { status: 401 });
    }
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.id === verified.userId);
    if (!account) {
      return HttpResponse.json({ errorMessage: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json({ name: account.name, memo: account.memo });
  }),
];
