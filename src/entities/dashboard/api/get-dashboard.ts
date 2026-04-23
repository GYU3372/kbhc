import { http } from '@/shared/api/http';
import type { DashboardResponse } from '../model/dashboard';

export const getDashboard = () => http.get<DashboardResponse>('/api/dashboard');
