import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { TrashIcon } from '@radix-ui/react-icons';
import { useState } from 'react';
import { taskQueries } from '@/entities/task';
import { DeleteTaskModal } from '@/features/task-delete';
import { HttpError } from '@/shared/api/http';
import { useDocumentTitle } from '@/shared/lib/use-document-title';
import { Button, EmptyState, Spinner } from '@/shared/ui';

type TaskDetailPageProps = {
  id: string;
};

const formatDateTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function TaskDetailPage({ id }: TaskDetailPageProps) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    ...taskQueries.detail(id),
    retry: (failureCount, err) => {
      if (err instanceof HttpError && err.status === 404) return false;
      return failureCount < 3;
    },
  });

  useDocumentTitle(data?.title ?? '할 일 상세');

  if (isLoading) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center p-4">
        <Spinner label="상세 정보 불러오는 중" />
      </main>
    );
  }

  if (isError && error instanceof HttpError && error.status === 404) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col p-4">
        <EmptyState
          title="할 일을 찾을 수 없어요"
          description={`ID: ${id}`}
          action={
            <Button onClick={() => navigate({ to: '/task' })}>목록으로</Button>
          }
        />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="mx-auto w-full max-w-5xl p-4">
        <p role="alert" className="text-sm text-danger">
          상세 정보를 불러오지 못했습니다.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <header className="flex flex-col gap-1">
        <p className="text-xs text-text-secondary">ID: {id}</p>
        <h1 className="text-xl font-semibold text-text-primary">{data.title}</h1>
        <p className="text-xs text-text-secondary">
          등록일 {formatDateTime(data.registerDatetime)}
        </p>
      </header>

      <section className="whitespace-pre-wrap rounded-lg border border-disabled bg-surface p-4 text-sm text-text-primary">
        {data.memo}
      </section>

      <div className="flex justify-end">
        <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
          <TrashIcon className="mr-1.5 h-4 w-4" aria-hidden />
          삭제
        </Button>
      </div>

      <DeleteTaskModal
        taskId={id}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onDeleted={() => navigate({ to: '/task' })}
      />
    </main>
  );
}
