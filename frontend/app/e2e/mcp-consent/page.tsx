import { McpConsentForm } from "@/app/mcp-consent/McpConsentForm";
import { OpenLogLogo } from "@/shared/ui/brand";

export default function McpConsentFixturePage() {
  return (
    <main className="min-h-dvh bg-app px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[520px] flex-col justify-center">
        <div className="flex items-center gap-3">
          <OpenLogLogo variant="mark" className="size-8" decorative />
          <p className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
            OpenLog Remote MCP
          </p>
        </div>
        <div className="mt-8 border-t border-zinc-200 pt-8">
          <McpConsentForm
            challenge={{
              challenge: "fixture_challenge_0123456789abcdefghijk",
              clientName: "Codex CLI",
              callbackOrigin: "http://127.0.0.1:1455",
              scope: "mcp:tools",
              expiresIn: 300,
              defaultPermissionProfile: "safe-write",
            }}
          />
        </div>
      </section>
    </main>
  );
}
