import { redirect } from "next/navigation";
import { getAppBootstrap } from "@/features/app-session/api/appBootstrapApi";
import { WorkspaceQueryProvider } from "@/features/app-session/ui/WorkspaceQueryProvider";
import { WorkspaceAppShell } from "@/widgets/app-shell/ui/WorkspaceAppShell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootstrap = await getAppBootstrap();
  if (!bootstrap) {
    redirect("/");
  }
  if (!bootstrap.user.isOnboardingComplete) {
    redirect("/onboarding");
  }
  return (
    <WorkspaceQueryProvider bootstrap={bootstrap}>
      <WorkspaceAppShell bootstrap={bootstrap}>{children}</WorkspaceAppShell>
    </WorkspaceQueryProvider>
  );
}
