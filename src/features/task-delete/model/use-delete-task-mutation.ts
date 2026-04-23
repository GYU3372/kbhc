import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskQueries } from '@/entities/task';
import { deleteTask } from '../api/delete-task';

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueries.lists() });
    },
  });
};
