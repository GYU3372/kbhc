import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { resetSession } from './reset-session';

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useCallback(() => resetSession(queryClient), [queryClient]);
};
