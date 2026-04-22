import { createFileRoute } from '@tanstack/react-router';
import { TaskDetailPage } from '@/pages/task-detail';

export const Route = createFileRoute('/_authed/task/$id')({
  component: TaskDetailRoute,
});

function TaskDetailRoute() {
  const { id } = Route.useParams();
  return <TaskDetailPage id={id} />;
}
