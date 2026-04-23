import { authHandlers } from './auth';
import { dashboardHandlers } from './dashboard';
import { taskHandlers } from './task';
import { userHandlers } from './user';

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...dashboardHandlers,
  ...taskHandlers,
];
