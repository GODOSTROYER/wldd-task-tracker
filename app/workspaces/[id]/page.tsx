import TasksPage from "@/app/tasks/page";

// Next.js 15: params is a Promise
export default async function WorkspaceTasksPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <TasksPage workspaceId={params.id} />;
}
