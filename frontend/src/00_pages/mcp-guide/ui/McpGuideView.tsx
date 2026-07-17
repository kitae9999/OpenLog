"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CLAUDE_MARK_ASSET,
  CODEX_MARK_ASSET,
  CURSOR_MARK_ASSET,
  NODE_MARK_ASSET,
} from "@/shared/config/brand";
import { cn } from "@/shared/lib/cn";
import { getTabHref } from "@/entities/workspace/model/data";
import {
  MCP_GUIDE_LOCALES,
  buildMcpGuideHref,
  mcpClientConfig,
  mcpGuideCommands,
  mcpGuideCopy,
  mcpGuideCopyButtonLabels,
  mcpGuidePermissionProfiles,
  parseMcpGuideLocale,
  type McpGuideLocale,
} from "@/pages/mcp-guide/model/mcpGuideContent";
import { McpSetupSteps } from "@/pages/mcp-guide/ui/McpSetupSteps";

const SUPPORTED_AGENTS = [
  { name: "Cursor", src: CURSOR_MARK_ASSET },
  { name: "Codex", src: CODEX_MARK_ASSET },
  { name: "Claude Code", src: CLAUDE_MARK_ASSET },
] as const;

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
        <span className="font-semibold text-zinc-950">
          {copy.breadcrumbCurrent}
        </span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3 pb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {copy.title}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[13px] leading-6 text-zinc-500">
            {copy.subtitle}
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {SUPPORTED_AGENTS.map((agent) => (
              <li
                key={agent.name}
                className="inline-flex items-center gap-2 text-[12.5px] font-medium text-zinc-600"
              >
                <Image
                  src={agent.src}
                  alt=""
                  width={16}
                  height={16}
                  unoptimized
                  className="shrink-0 object-contain"
                />
                <span>{agent.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <LocaleToggle locale={locale} onChange={setLocale} />
      </header>

      <div className="space-y-0 divide-y divide-zinc-200/80">
        <GuideSection title={copy.sections.setup.title}>
          <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <Image
              src={NODE_MARK_ASSET}
              alt=""
              width={16}
              height={16}
              unoptimized
              className="shrink-0 object-contain"
            />
            <span>{copy.sections.setup.prerequisiteBefore}</span>
            <a
              href="https://nodejs.org/en/download"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-950 underline underline-offset-2 transition hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
            >
              {copy.sections.setup.prerequisiteLink}
            </a>
            <span>{copy.sections.setup.prerequisiteAfter}</span>
          </p>
          <p>{copy.sections.setup.body}</p>
          <CodeBlock locale={locale}>{mcpGuideCommands.setup}</CodeBlock>
          <McpSetupSteps steps={copy.sections.setup.steps} className="mt-2" />
          <p className="text-[12.5px] text-zinc-500">
            {copy.sections.setup.footnoteBefore}{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11.5px]">
              {mcpGuideCommands.setupAgain}
            </code>
            {copy.sections.setup.footnoteAfter}
          </p>
        </GuideSection>

        <CollapsibleGuideSection title={copy.sections.advanced.title}>
          <p>{copy.sections.advanced.body}</p>
          <CodeBlock locale={locale}>{mcpClientConfig}</CodeBlock>
          <p>{copy.sections.advanced.installers}</p>
          <CodeBlock
            locale={locale}
          >{`${mcpGuideCommands.installAll}\n\n${mcpGuideCommands.installCodex}\n${mcpGuideCommands.installClaude}\n${mcpGuideCommands.installCursor}`}</CodeBlock>
          <p>{copy.sections.advanced.manualBody}</p>
          <CodeBlock locale={locale}>{mcpGuideCommands.mcp}</CodeBlock>
          <p className="text-[12.5px] text-zinc-500">
            {copy.sections.advanced.manualFootnote}
          </p>
          <p>{copy.sections.advanced.permissionsBody}</p>
          <CodeBlock locale={locale}>{mcpGuideCommands.permissions}</CodeBlock>
          <div className="openlog-scroll overflow-x-auto">
            <table className="w-full min-w-[540px] border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="px-2.5 py-2.5 font-semibold text-zinc-600">
                    {copy.sections.advanced.colProfile}
                  </th>
                  <th className="px-2.5 py-2.5 font-semibold text-zinc-600">
                    {copy.sections.advanced.colCapability}
                  </th>
                </tr>
              </thead>
              <tbody>
                {mcpGuidePermissionProfiles.map((profile) => (
                  <tr
                    key={profile.name}
                    className="border-b border-zinc-200/80 last:border-b-0"
                  >
                    <td className="px-2.5 py-2.5 align-top">
                      <code className="font-mono text-[12px] text-zinc-950">
                        {profile.name}
                      </code>
                    </td>
                    <td className="px-2.5 py-2.5 text-zinc-600">
                      {profile.description[locale]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12.5px] text-zinc-500">
            {copy.sections.advanced.permissionsFootnote}
          </p>
        </CollapsibleGuideSection>

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
          {index > 0 ? (
            <span className="font-normal text-zinc-300">/</span>
          ) : null}
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

function CollapsibleGuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="group py-8 first:pt-0">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[13.5px] font-semibold tracking-tight text-zinc-600 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="inline-flex size-4 shrink-0 items-center justify-center text-zinc-400 transition group-open:rotate-90"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none">
            <path
              d="M6 3.5 10.5 8 6 12.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {title}
      </summary>
      <div className="mt-3 space-y-3 text-[13.5px] leading-6 text-zinc-600">
        {children}
      </div>
    </details>
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
          "openlog-scroll min-w-0 flex-1 overflow-x-auto px-3.5 py-3",
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
      <path
        d="M3.75 5.25V12a1.5 1.5 0 0 0 1.5 1.5H10.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
