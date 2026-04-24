import { useNavigate } from '@tanstack/react-router';

import { useDocumentTitle } from '@/shared/lib/use-document-title';
import { Button, EmptyState } from '@/shared/ui';

export function NotFoundPage() {
  useDocumentTitle('페이지를 찾을 수 없음');
  const navigate = useNavigate();

  return (
    <main className="flex flex-1 flex-col p-4">
      <EmptyState
        title="페이지를 찾을 수 없어요"
        description="주소가 바뀌었거나 삭제된 페이지일 수 있어요."
        action={<Button onClick={() => navigate({ to: '/' })}>홈으로</Button>}
      />
    </main>
  );
}
