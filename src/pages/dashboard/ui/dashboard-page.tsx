import { useQuery } from '@tanstack/react-query';
import { dashboardQueries } from '@/entities/dashboard';
import { useDocumentTitle } from '@/shared/lib/use-document-title';
import { Card, Spinner } from '@/shared/ui';

const METRIC_LABEL = {
  numOfTask: '일',
  numOfRestTask: '해야할 일',
  numOfDoneTask: '한 일',
} as const;

export function DashboardPage() {
  useDocumentTitle('대시보드');
  const { data, isLoading, isError } = useQuery(dashboardQueries.summary());

  return (
    <main className="flex flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold text-text-primary">대시보드</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner label="대시보드 불러오는 중" />
        </div>
      ) : isError || !data ? (
        <p role="alert" className="text-sm text-danger">
          대시보드를 불러오지 못했습니다.
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(Object.keys(METRIC_LABEL) as Array<keyof typeof METRIC_LABEL>).map((key) => (
            <Card key={key}>
              <dt className="text-sm text-text-secondary">{METRIC_LABEL[key]}</dt>
              <dd className="mt-2 text-2xl font-semibold text-text-primary">{data[key]}</dd>
            </Card>
          ))}
        </dl>
      )}
    </main>
  );
}
