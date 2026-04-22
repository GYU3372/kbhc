type TaskDetailPageProps = {
  id: string;
};

export function TaskDetailPage({ id }: TaskDetailPageProps) {
  return <main className="p-4 font-sans">Hello Task Detail (id: {id})</main>;
}
