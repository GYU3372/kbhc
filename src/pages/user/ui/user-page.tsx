import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ExitIcon } from '@radix-ui/react-icons';

import { useSignOut } from '@/features/auth';
import { userQueries } from '@/entities/user';
import { useDocumentTitle } from '@/shared/lib/use-document-title';
import { Button, Card, EmptyState, Spinner } from '@/shared/ui';

export function UserPage() {
  useDocumentTitle('회원정보');
  const navigate = useNavigate();
  const signOut = useSignOut();
  const query = useQuery(userQueries.me());

  const handleLogout = () => {
    signOut();
    void navigate({ to: '/sign-in' });
  };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-6 font-sans">
      <h1 className="text-xl font-semibold text-text-primary">회원정보</h1>

      {query.isPending ? (
        <div className="flex justify-center py-10">
          <Spinner label="회원정보 불러오는 중" />
        </div>
      ) : query.isError ? (
        <EmptyState
          title="회원정보를 불러오지 못했습니다"
          description="잠시 후 다시 시도해주세요."
          action={
            <Button variant="ghost" onClick={() => query.refetch()}>
              다시 시도
            </Button>
          }
        />
      ) : (
        <Card>
          <dl className="flex flex-col gap-4">
            <div>
              <dt className="text-xs font-medium text-text-secondary">이름</dt>
              <dd className="mt-1 text-base text-text-primary">{query.data.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-text-secondary">메모</dt>
              <dd className="mt-1 text-sm text-text-primary">{query.data.memo}</dd>
            </div>
          </dl>
        </Card>
      )}

      <Button variant="ghost" onClick={handleLogout} className="self-end">
        <ExitIcon aria-hidden="true" width={16} height={16} className="mr-1.5" />
        로그아웃
      </Button>
    </main>
  );
}
