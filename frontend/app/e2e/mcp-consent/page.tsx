import { McpConsentForm } from "@/app/mcp-consent/McpConsentForm";
import { OpenLogLogo } from "@/shared/ui/brand";

export default function McpConsentFixturePage() {
  return (
    <main className="min-h-dvh bg-zinc-100 px-5 py-10 text-zinc-950 sm:px-8">
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[560px] flex-col justify-center">
        <div className="border border-zinc-200 bg-white">
          <header className="border-b border-zinc-200 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <OpenLogLogo variant="mark" className="size-8" decorative />
              <p className="text-[13px] font-semibold">OpenLog Remote MCP</p>
            </div>
          </header>
          <div className="px-6 py-7 sm:px-8 sm:py-8">
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
        </div>
      </section>
    </main>
  );
}
