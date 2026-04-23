import { http } from '@/shared/api/http';
import type { UserResponse } from '../model/user';

export const getUser = () => http.get<UserResponse>('/api/user');
