"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { API_CONFIG } from "@/shared/api";
import {
  CLAUDE_MARK_ASSET,
  CODEX_MARK_ASSET,
  CURSOR_MARK_ASSET,
} from "@/shared/config/brand";
import { cn } from "@/shared/lib/cn";
import type { McpConnection } from "@/features/mcp/api/mcpConnections";
import {
  revokeMcpConnection,
  updateMcpConnection,
} from "@/app/settings/mcp-guide/actions";
import {
  buildMcpGuideHref,
  MCP_GUIDE_LOCALES,
  remoteMcpGuideCopy,
  type McpGuideLocale,
} from "@/pages/mcp-guide/model/mcpGuideContent";
import { McpCommandTerminal } from "@/pages/mcp-guide/ui/McpCommandTerminal";

const MCP_URL = "https://api.openlog.kr/mcp";
const CURSOR_INSTALL_URL =
  "https://cursor.com/install-mcp?name=openlog&config=eyJ1cmwiOiJodHRwczovL2FwaS5vcGVubG9nLmtyL21jcCJ9";
const CODEX_COMMAND = `codex mcp add openlog --url ${MCP_URL}`;
const CLAUDE_COMMAND = `claude mcp add --transport http --scope user openlog ${MCP_URL}
claude mcp login openlog`;

export function McpGuideView({
  isLoggedIn,
  connections,
  locale,
}: {
  isLoggedIn: boolean;
  connections: McpConnection[];
  locale: McpGuideLocale;
}) {
  const copy = remoteMcpGuideCopy[locale];
  const returnTo = buildMcpGuideHref(locale);

  return (
    <div className="mx-auto w-full max-w-[920px]">
      <nav
        aria-label="Breadcrumb"
        className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] text-zinc-500"
      >
        <Link
          href="/"
          className="font-medium transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
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

      <header className="flex flex-wrap items-end justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-950">
            {copy.title}
          </h1>
          <p className="mt-1.5 max-w-[62ch] text-[13px] leading-6 text-zinc-500">
            {copy.subtitle}
          </p>
        </div>
        <LocaleToggle locale={locale} />
      </header>

      <section aria-labelledby="agents-heading">
        <div className="border-b border-zinc-200 pb-3">
          <h2
            id="agents-heading"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {copy.agents.title}
          </h2>
        </div>

        <ul className="mt-1">
          <AgentRow
            logoSrc={CURSOR_MARK_ASSET}
            logoAlt="Cursor"
            name="Cursor"
            status={copy.agents.cursor.status}
            description={copy.agents.cursor.description}
            action={
              <a
                href={CURSOR_INSTALL_URL}
                className="text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
              >
                {copy.agents.cursor.action}
              </a>
            }
          />
          <AgentRow
            logoSrc={CODEX_MARK_ASSET}
            logoAlt="Codex"
            name="Codex"
            status={copy.agents.codex.status}
            description={copy.agents.codex.description}
            action={
              <CopyCommand
                command={CODEX_COMMAND}
                label={copy.agents.codex.action}
              />
            }
          />
          <AgentRow
            logoSrc={CLAUDE_MARK_ASSET}
            logoAlt="Claude Code"
            name="Claude Code"
            status={copy.agents.claude.status}
            description={copy.agents.claude.description}
            action={
              <CopyCommand
                command={CLAUDE_COMMAND}
                label={copy.agents.claude.action}
              />
            }
          />
        </ul>

        <div className="mt-5 space-y-2.5">
          <p className="text-[12.5px] leading-5 text-zinc-500">
            {copy.agents.terminalHint}
          </p>
          <McpCommandTerminal
            command={`claude --version
${CLAUDE_COMMAND}`}
            title={copy.agents.terminalTitle}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="connections-heading">
        <div className="border-b border-zinc-200 pb-3">
          <h2
            id="connections-heading"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {copy.connections.title}
          </h2>
        </div>
        <div className="mt-1">
          {!isLoggedIn ? (
            <SignedOutState
              returnTo={returnTo}
              body={copy.connections.signedOut}
              loginLabel={copy.connections.login}
            />
          ) : connections.length === 0 ? (
            <EmptyConnections body={copy.connections.empty} />
          ) : (
            <ul>
              {connections.map((connection) => (
                <ConnectionRow
                  key={connection.id}
                  connection={connection}
                  connectedOnLabel={copy.connections.connectedOn}
                  permissionAria={copy.connections.permissionAria}
                  fullOption={copy.connections.fullOption}
                  updateLabel={copy.connections.update}
                  revokeLabel={copy.connections.revoke}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="permissions-heading">
        <div className="border-b border-zinc-200 pb-3">
          <h2
            id="permissions-heading"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {copy.permissions.title}
          </h2>
        </div>
        <ul className="mt-1">
          <PermissionRow
            name="read-only"
            capabilities="read"
            description={copy.permissions.readOnly}
          />
          <PermissionRow
            name="safe-write"
            capabilities="read · write · publish"
            description={copy.permissions.safeWrite}
            selected
          />
          <PermissionRow
            name="full"
            capabilities="+ delete"
            description={copy.permissions.full}
            danger
          />
        </ul>
        <p className="mt-4 text-[12.5px] leading-5 text-zinc-500">
          {copy.permissions.footnote}
        </p>
      </section>

      <section className="mt-10" aria-labelledby="manual-heading">
        <div className="border-b border-zinc-200 pb-3">
          <h2
            id="manual-heading"
            className="text-[13.5px] font-semibold tracking-tight text-zinc-600"
          >
            {copy.manual.title}
          </h2>
        </div>
        <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-6 text-zinc-700">
          <code>{`{
  "mcpServers": {
    "openlog": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`}</code>
        </pre>
        <p className="mt-4 border-l-2 border-zinc-300 py-1 pl-4 text-[12.5px] leading-5 text-zinc-500">
          {copy.manual.footnote}
        </p>
      </section>
    </div>
  );
}

function LocaleToggle({ locale }: { locale: McpGuideLocale }) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="flex items-center gap-1.5 text-[12px] font-medium"
    >
      {MCP_GUIDE_LOCALES.map((item, index) => (
        <span key={item.key} className="flex items-center gap-1.5">
          {index > 0 ? (
            <span className="text-zinc-300" aria-hidden="true">
              /
            </span>
          ) : null}
          <Link
            href={buildMcpGuideHref(item.key)}
            aria-current={locale === item.key ? "page" : undefined}
            className={cn(
              "transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
              locale === item.key
                ? "font-semibold text-zinc-950"
                : "text-zinc-400 hover:text-zinc-700",
            )}
          >
            {item.label}
          </Link>
        </span>
      ))}
    </div>
  );
}

function AgentRow({
  logoSrc,
  logoAlt,
  name,
  status,
  description,
  action,
}: {
  logoSrc: string;
  logoAlt: string;
  name: string;
  status: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div className="grid gap-3 px-2.5 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={18}
              height={18}
              unoptimized
              className="shrink-0 object-contain"
            />
            <p className="text-[14.5px] font-medium text-zinc-950">{name}</p>
            <span className="text-[11.5px] text-zinc-400">{status}</span>
          </div>
          <p className="mt-1.5 pl-[28px] text-[12.5px] leading-5 text-zinc-500">
            {description}
          </p>
        </div>
        <div className="pl-[28px] sm:pl-0 sm:justify-self-end">{action}</div>
      </div>
    </li>
  );
}

function CopyCommand({ command, label }: { command: string; label: string }) {
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
    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const isCopied = copyState === "copied";
  const buttonLabel =
    copyState === "copied"
      ? "Copied!"
      : copyState === "error"
        ? "Failed"
        : label;

  return (
    <button
      type="button"
      aria-label={buttonLabel}
      onClick={async () => {
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(command);
          } else {
            copyWithSelectionFallback(command);
          }
          setCopyState("copied");
        } catch {
          setCopyState("error");
        }
      }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20",
        isCopied
          ? "text-emerald-600"
          : copyState === "error"
            ? "text-rose-600"
            : "text-zinc-500 hover:text-zinc-950",
      )}
    >
      {isCopied ? (
        <span
          className="inline-flex scale-110 transition-transform duration-200"
          aria-hidden="true"
        >
          <IconCheck className="size-3.5" />
        </span>
      ) : null}
      <span aria-live="polite">{buttonLabel}</span>
    </button>
  );
}

function copyWithSelectionFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConnectionRow({
  connection,
  connectedOnLabel,
  permissionAria,
  fullOption,
  updateLabel,
  revokeLabel,
}: {
  connection: McpConnection;
  connectedOnLabel: string;
  permissionAria: string;
  fullOption: string;
  updateLabel: string;
  revokeLabel: string;
}) {
  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div className="grid gap-3 px-2.5 py-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14.5px] font-medium text-zinc-950">
              {connection.clientName}
            </p>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-emerald-700">
              connected
            </span>
          </div>
          <p className="mt-1 truncate font-mono text-[11.5px] text-zinc-500">
            {connection.callbackOrigin}
          </p>
          <p className="mt-0.5 text-[11.5px] text-zinc-400">
            {connectedOnLabel} {connection.createdAt.slice(0, 10)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <form action={updateMcpConnection} className="flex items-center gap-2">
            <input type="hidden" name="connectionId" value={connection.id} />
            <select
              name="permissionProfile"
              defaultValue={connection.permissionProfile}
              aria-label={`${permissionAria} ${connection.clientName}`}
              className="h-8 border-0 border-b border-zinc-200 bg-transparent px-0 text-[12.5px] font-medium text-zinc-800 outline-none focus:border-zinc-500"
            >
              <option value="read-only">read-only</option>
              <option value="safe-write">safe-write</option>
              <option value="full">{fullOption}</option>
            </select>
            <button className="text-[12px] font-medium text-zinc-500 transition hover:text-zinc-950">
              {updateLabel}
            </button>
          </form>
          <form action={revokeMcpConnection}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <button className="text-[12px] font-medium text-zinc-400 transition hover:text-rose-700">
              {revokeLabel}
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

function SignedOutState({
  returnTo,
  body,
  loginLabel,
}: {
  returnTo: string;
  body: string;
  loginLabel: string;
}) {
  const loginUrl = new URL(
    `${API_CONFIG.baseURL.replace(/\/$/, "")}/auth/github`,
  );
  loginUrl.searchParams.set("returnTo", returnTo);
  return (
    <div className="mt-6 pl-2.5">
      <p className="text-sm text-zinc-500">{body}</p>
      <a
        href={loginUrl.toString()}
        className="mt-3 inline-flex text-[13px] font-medium text-zinc-500 transition hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
      >
        {loginLabel}
      </a>
    </div>
  );
}

function EmptyConnections({ body }: { body: string }) {
  return (
    <div className="mt-6 pl-2.5">
      <p className="text-sm text-zinc-500">{body}</p>
    </div>
  );
}

function PermissionRow({
  name,
  capabilities,
  description,
  selected = false,
  danger = false,
}: {
  name: string;
  capabilities: string;
  description: string;
  selected?: boolean;
  danger?: boolean;
}) {
  return (
    <li className="border-t border-zinc-200/80 first:border-t-0">
      <div className="grid gap-1 px-2.5 py-3.5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-4">
        <div className="flex items-baseline gap-2">
          <code
            className={cn(
              "font-mono text-[12.5px] font-semibold",
              danger ? "text-rose-700" : "text-zinc-950",
            )}
          >
            {name}
          </code>
          {selected ? (
            <span className="text-[10.5px] font-medium uppercase tracking-[0.1em] text-zinc-400">
              default
            </span>
          ) : null}
        </div>
        <div>
          <p className="font-mono text-[11px] text-zinc-400">{capabilities}</p>
          <p className="mt-0.5 text-[12.5px] leading-5 text-zinc-500">
            {description}
          </p>
        </div>
      </div>
    </li>
  );
}
