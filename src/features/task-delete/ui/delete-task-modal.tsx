import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { HttpError } from '@/shared/api/http';
import { Button, Input, Modal } from '@/shared/ui';
import { useDeleteTaskMutation } from '../model/use-delete-task-mutation';

type DeleteTaskModalProps = {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
};

export function DeleteTaskModal({ taskId, open, onOpenChange, onDeleted }: DeleteTaskModalProps) {
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutation = useDeleteTaskMutation();

  useEffect(() => {
    if (!open) {
      setValue('');
      setErrorMessage(null);
      mutation.reset();
    }
    // mutation.reset 호출 타이밍만 open 변화에 묶는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const canSubmit = value === taskId && !mutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);
    mutation.mutate(taskId, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted();
      },
      onError: (error) => {
        if (error instanceof HttpError) {
          const body = error.body as { errorMessage?: string } | null;
          setErrorMessage(body?.errorMessage ?? '삭제에 실패했습니다.');
        } else {
          setErrorMessage('삭제에 실패했습니다.');
        }
      },
    });
  };

  return (
    <Modal.Root open={open} onOpenChange={onOpenChange}>
      <Modal.Content>
        <Modal.Title>할 일 삭제</Modal.Title>
        <Modal.Description>
          아래 입력창에 ID를 동일하게 입력해야 삭제할 수 있습니다.
        </Modal.Description>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <Input
            label="삭제할 할 일 ID"
            hint={`ID: ${taskId}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete="off"
          />
          {errorMessage ? (
            <p role="alert" className="text-sm text-danger">
              {errorMessage}
            </p>
          ) : null}
          <Modal.Footer>
            <Modal.Close asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </Modal.Close>
            <Button type="submit" variant="danger" disabled={!canSubmit}>
              제출
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Content>
    </Modal.Root>
  );
}
