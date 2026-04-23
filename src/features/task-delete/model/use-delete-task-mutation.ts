import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardQueries } from '@/entities/dashboard';
import { taskQueries } from '@/entities/task';
import { deleteTask } from '../api/delete-task';

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: taskQueries.lists() });
      void queryClient.removeQueries({ queryKey: taskQueries.detail(id).queryKey });
      void queryClient.invalidateQueries({ queryKey: dashboardQueries.all() });
    },
  });
};
