import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

type HighlightResult = {
  html: string;
  languageLabel: string;
};

const SUPPORTED_LANGUAGES = [
  "bash",
  "css",
  "javascript",
  "json",
  "markdown",
  "plaintext",
  "python",
  "sql",
  "typescript",
  "xml",
  "yaml",
] as const;

const LANGUAGE_ALIASES: Record<string, (typeof SUPPORTED_LANGUAGES)[number]> = {
  bash: "bash",
  cjs: "javascript",
  css: "css",
  html: "xml",
  javascript: "javascript",
  js: "javascript",
  json: "json",
  jsx: "javascript",
  markdown: "markdown",
  md: "markdown",
  plain: "plaintext",
  plaintext: "plaintext",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  sql: "sql",
  svg: "xml",
  ts: "typescript",
  tsx: "typescript",
  txt: "plaintext",
  typescript: "typescript",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
};

let isConfigured = false;

export function highlightCodeBlock(
  code: string,
  language: string,
): HighlightResult {
  ensureHighlightLanguages();

  const preferredLanguage = normalizeLanguage(language);
  if (preferredLanguage) {
    return {
      html: hljs.highlight(code, {
        ignoreIllegals: true,
        language: preferredLanguage,
      }).value,
      languageLabel: language.trim() || preferredLanguage,
    };
  }

  const autoDetected = hljs.highlightAuto(code, [...SUPPORTED_LANGUAGES]);
  return {
    html: autoDetected.value || escapeHtml(code),
    languageLabel: autoDetected.language ?? "code",
  };
}

function ensureHighlightLanguages() {
  if (isConfigured) {
    return;
  }

  if (!hljs.getLanguage("bash")) {
    hljs.registerLanguage("bash", bash);
  }
  if (!hljs.getLanguage("css")) {
    hljs.registerLanguage("css", css);
  }
  if (!hljs.getLanguage("javascript")) {
    hljs.registerLanguage("javascript", javascript);
  }
  if (!hljs.getLanguage("json")) {
    hljs.registerLanguage("json", json);
  }
  if (!hljs.getLanguage("markdown")) {
    hljs.registerLanguage("markdown", markdown);
  }
  if (!hljs.getLanguage("plaintext")) {
    hljs.registerLanguage("plaintext", plaintext);
  }
  if (!hljs.getLanguage("python")) {
    hljs.registerLanguage("python", python);
  }
  if (!hljs.getLanguage("sql")) {
    hljs.registerLanguage("sql", sql);
  }
  if (!hljs.getLanguage("typescript")) {
    hljs.registerLanguage("typescript", typescript);
  }
  if (!hljs.getLanguage("xml")) {
    hljs.registerLanguage("xml", xml);
  }
  if (!hljs.getLanguage("yaml")) {
    hljs.registerLanguage("yaml", yaml);
  }

  isConfigured = true;
}

function normalizeLanguage(language: string) {
  const normalized = language.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return LANGUAGE_ALIASES[normalized] ?? null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
