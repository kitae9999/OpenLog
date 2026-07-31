import {
  WorkspaceQueryFixture,
  type WorkspaceQueryFixtureView,
} from "./WorkspaceQueryFixture";

const supportedViews = new Set<WorkspaceQueryFixtureView>([
  "tasks",
  "memory",
  "issues",
  "task-detail",
  "log-create",
  "log-detail",
  "output-detail",
  "memory-new",
]);

export default async function WorkspaceQueryFixturePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const requestedView = (await searchParams).view;
  const view = supportedViews.has(requestedView as WorkspaceQueryFixtureView)
    ? (requestedView as WorkspaceQueryFixtureView)
    : "tasks";

  return <WorkspaceQueryFixture view={view} />;
}
