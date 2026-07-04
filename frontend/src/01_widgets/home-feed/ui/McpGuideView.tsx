"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { getTabHref } from "./data";
import {
  MCP_GUIDE_LOCALES,
  buildMcpGuideHref,
  mcpClientConfig,
  mcpGuideCommands,
  mcpGuideCopy,
  mcpGuideCopyButtonLabels,
  mcpGuideTools,
  parseMcpGuideLocale,
  type McpGuideLocale,
} from "./mcpGuideContent";

export function McpGuideView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useMemo(
    () => parseMcpGuideLocale(searchParams.get("lang")),
    [searchParams],
  );
  const copy = mcpGuideCopy[locale];

  function setLocale(next: McpGuideLocale) {
    router.push(buildMcpGuideHref(next));
  }

  return (
    <div>
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-semibold text-zinc-700 transition hover:text-zinc-950"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span>{copy.breadcrumbSettings}</span>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">{copy.breadcrumbCurrent}</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/70 bg-white">
        <header className="border-b border-zinc-100 px-6 pb-5 pt-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-[family-name:var(--font-georgia,Georgia,serif)] text-2xl font-bold tracking-[-0.01em] text-zinc-950">
                {copy.title}
              </h1>
              <p className="mt-2 max-w-[62ch] text-[13.5px] leading-6 text-zinc-500">
                {copy.subtitle}
              </p>
            </div>
            <LocaleToggle locale={locale} onChange={setLocale} />
          </div>
        </header>

        <div className="space-y-0 divide-y divide-zinc-100 px-6 py-2">
          <GuideSection title={copy.sections.login.title}>
            <p>{copy.sections.login.body}</p>
            <CodeBlock locale={locale}>{mcpGuideCommands.login}</CodeBlock>
            <p className="text-[12.5px] text-zinc-500">
              {copy.sections.login.footnoteBefore}{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                openlog whoami
              </code>
              .{" "}
              {locale === "en" ? (
                <>
                  The sidebar footer shows{" "}
                  <strong className="font-semibold text-zinc-700">
                    {copy.sections.login.mcpConnected}
                  </strong>{" "}
                  when a client is linked.
                </>
              ) : (
                <>
                  client가 연결되면 사이드바 하단에{" "}
                  <strong className="font-semibold text-zinc-700">
                    {copy.sections.login.mcpConnected}
                  </strong>
                  가 표시됩니다.
                </>
              )}
            </p>
          </GuideSection>

          <GuideSection title={copy.sections.register.title}>
            <p>{copy.sections.register.body}</p>
            <CodeBlock locale={locale}>{mcpClientConfig}</CodeBlock>
            <p>{copy.sections.register.installers}</p>
            <CodeBlock locale={locale}>{`${mcpGuideCommands.installCodex}\n${mcpGuideCommands.installClaude}`}</CodeBlock>
          </GuideSection>

          <GuideSection title={copy.sections.manual.title}>
            <p>{copy.sections.manual.body}</p>
            <CodeBlock locale={locale}>{mcpGuideCommands.mcp}</CodeBlock>
            <p className="text-[12.5px] text-zinc-500">{copy.sections.manual.footnote}</p>
          </GuideSection>

          <GuideSection title={copy.sections.tools.title}>
            <div className="overflow-x-auto rounded-xl border border-zinc-200/70">
              <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    <th className="px-4 py-2.5 font-semibold text-zinc-700">
                      {copy.sections.tools.colTool}
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-zinc-700">
                      {copy.sections.tools.colDescription}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mcpGuideTools.map((tool) => (
                    <tr
                      key={tool.name}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <td className="px-4 py-2.5 align-top">
                        <code className="font-mono text-[12px] text-zinc-950">
                          {tool.name}
                        </code>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-600">
                        {tool.description[locale]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12.5px] text-zinc-500">
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                publish_post
              </code>{" "}
              {copy.sections.tools.footnoteBefore}{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                confirm: true
              </code>{" "}
              {copy.sections.tools.footnoteAfter}
            </p>
          </GuideSection>

          <GuideSection title={copy.sections.local.title}>
            <p>{copy.sections.local.body}</p>
            <CodeBlock locale={locale}>{mcpGuideCommands.localDev}</CodeBlock>
            <dl className="grid gap-2 text-[12.5px] text-zinc-600 sm:grid-cols-1">
              <div>
                <dt className="font-mono text-[11.5px] font-semibold text-zinc-500">
                  OPENLOG_API_BASE_URL
                </dt>
                <dd>{copy.sections.local.envApi}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11.5px] font-semibold text-zinc-500">
                  OPENLOG_WEB_BASE_URL
                </dt>
                <dd>{copy.sections.local.envWeb}</dd>
              </div>
              <div>
                <dt className="font-mono text-[11.5px] font-semibold text-zinc-500">
                  OPENLOG_AUTH_FILE
                </dt>
                <dd>
                  {copy.sections.local.envAuthBefore}{" "}
                  <code className="font-mono text-[11px]">~/.openlog/auth.json</code>
                  {copy.sections.local.envAuthAfter}
                </dd>
              </div>
            </dl>
          </GuideSection>

          <GuideSection title={copy.sections.troubleshooting.title}>
            <ul className="list-disc space-y-2 pl-5 text-[13.5px] text-zinc-600">
              {copy.sections.troubleshooting.items.map((item) => (
                <li key={item.label}>
                  <TroubleshootingItem label={item.label} body={item.body} />
                </li>
              ))}
            </ul>
          </GuideSection>
        </div>

        <footer className="border-t border-zinc-100 px-6 py-4">
          <p className="text-[12.5px] text-zinc-500">
            {copy.footerPackage}{" "}
            <a
              href="https://www.npmjs.com/package/@kitae9999/openlog-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-zinc-700 underline-offset-2 hover:text-zinc-950 hover:underline"
            >
              @kitae9999/openlog-cli
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
}

function LocaleToggle({
  locale,
  onChange,
}: {
  locale: McpGuideLocale;
  onChange: (locale: McpGuideLocale) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Guide language"
      className="inline-flex shrink-0 gap-0.5 rounded-full border border-zinc-200 bg-white p-0.5"
    >
      {MCP_GUIDE_LOCALES.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={locale === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-full px-3 py-1 text-[11.5px] font-bold tracking-[0.06em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
            locale === item.key
              ? "bg-zinc-950 text-white"
              : "text-zinc-400 hover:text-zinc-950",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function TroubleshootingItem({ label, body }: { label: string; body: string }) {
  const parts = body.split(/(`[^`]+`)/g);

  return (
    <>
      <strong className="font-semibold text-zinc-800">{label}</strong>
      {" — "}
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={index}
            className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-5">
      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-zinc-950">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[13.5px] leading-6 text-zinc-600">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({
  children,
  locale,
}: {
  children: string;
  locale: McpGuideLocale;
}) {
  const labels = mcpGuideCopyButtonLabels[locale];
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyState]);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(children);
      } else {
        copyWithSelectionFallback(children);
      }

      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  const isCopied = copyState === "copied";
  const tooltipLabel =
    copyState === "copied"
      ? labels.copied
      : copyState === "error"
        ? labels.retry
        : labels.copy;

  return (
    <div className="flex overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
      <pre
        className={cn(
          "min-w-0 flex-1 overflow-x-auto px-4 py-3",
          "font-mono text-[12px] leading-[1.55] text-zinc-800",
        )}
      >
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "inline-flex shrink-0 self-start px-3 pt-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-zinc-900/20",
          isCopied
            ? "text-emerald-600"
            : copyState === "error"
              ? "text-rose-600 hover:text-rose-700"
              : "text-zinc-400 hover:text-zinc-700",
        )}
        aria-label={labels.aria}
        title={tooltipLabel}
      >
        <CopyIcon copied={isCopied} />
      </button>
    </div>
  );
}

function copyWithSelectionFallback(code: string) {
  const textarea = document.createElement("textarea");
  textarea.value = code;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const didCopy = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!didCopy) {
    throw new Error("copy failed");
  }
}

function CopyIcon({ copied }: { copied: boolean }) {
  if (copied) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-[18px] shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path
          d="M3.75 8.25 6.5 11l5.75-6.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="5.25" y="2.75" width="7" height="9" rx="1.5" />
      <path d="M3.75 5.25V12a1.5 1.5 0 0 0 1.5 1.5H10.5" strokeLinecap="round" />
    </svg>
  );
}
