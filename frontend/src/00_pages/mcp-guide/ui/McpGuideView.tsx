"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { getTabHref } from "@/entities/workspace/model/data";
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
} from "@/pages/mcp-guide/model/mcpGuideContent";

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
    <div className="mx-auto w-full max-w-[920px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href={getTabHref("workspace", isLoggedIn)}
          className="font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          openlog
        </Link>
        <span className="text-zinc-300">/</span>
        <span>{copy.breadcrumbSettings}</span>
        <span className="text-zinc-300">/</span>
        <span className="font-semibold text-zinc-950">{copy.breadcrumbCurrent}</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {copy.title}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[13px] leading-6 text-zinc-500">
            {copy.subtitle}
          </p>
        </div>
        <LocaleToggle locale={locale} onChange={setLocale} />
      </header>

      <div className="space-y-0 divide-y divide-zinc-200/80">
          <GuideSection title={copy.sections.login.title}>
            <p>{copy.sections.login.body}</p>
            <CodeBlock locale={locale}>{mcpGuideCommands.login}</CodeBlock>
            <p className="text-[12.5px] text-zinc-500">
              {copy.sections.login.footnoteBefore}{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                openlog whoami
              </code>
              {copy.sections.login.footnoteAfter}
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
            <div className="openlog-scroll overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="px-2.5 py-2.5 font-semibold text-zinc-600">
                      {copy.sections.tools.colTool}
                    </th>
                    <th className="px-2.5 py-2.5 font-semibold text-zinc-600">
                      {copy.sections.tools.colDescription}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mcpGuideTools.map((tool) => (
                    <tr
                      key={tool.name}
                      className="border-b border-zinc-200/80 last:border-b-0"
                    >
                      <td className="px-2.5 py-2.5 align-top">
                        <code className="font-mono text-[12px] text-zinc-950">
                          {tool.name}
                        </code>
                      </td>
                      <td className="px-2.5 py-2.5 text-zinc-600">
                        {tool.description[locale]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[12.5px] text-zinc-500">
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
                publish_output
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

      <footer className="mt-8 border-t border-zinc-200 pt-4">
        <p className="text-[12.5px] text-zinc-500">
          {copy.footerPackage}{" "}
          <a
            href="https://www.npmjs.com/package/@openloghq/cli"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-700 underline-offset-2 transition hover:text-zinc-950 hover:underline"
          >
            @openloghq/cli
          </a>
        </p>
      </footer>
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
      className="inline-flex shrink-0 items-center gap-2 text-[12.5px] font-medium"
    >
      {MCP_GUIDE_LOCALES.map((item, index) => (
        <span key={item.key} className="inline-flex items-center gap-2">
          {index > 0 ? <span className="font-normal text-zinc-300">/</span> : null}
          <button
            type="button"
            aria-pressed={locale === item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              locale === item.key
                ? "text-zinc-950"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            {item.label}
          </button>
        </span>
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
    <section className="py-8 first:pt-0">
      <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-600">
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
    <div className="flex overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      <pre
        className={cn(
          "min-w-0 flex-1 overflow-x-auto px-3.5 py-3",
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
