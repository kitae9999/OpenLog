import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import c from "highlight.js/lib/languages/c";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import java from "highlight.js/lib/languages/java";
import json from "highlight.js/lib/languages/json";
import kotlin from "highlight.js/lib/languages/kotlin";
import markdown from "highlight.js/lib/languages/markdown";
import php from "highlight.js/lib/languages/php";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import ruby from "highlight.js/lib/languages/ruby";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import swift from "highlight.js/lib/languages/swift";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

type HighlightResult = {
  html: string;
  languageLabel: string;
};

const SUPPORTED_LANGUAGES = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "css",
  "go",
  "javascript",
  "java",
  "json",
  "kotlin",
  "markdown",
  "php",
  "plaintext",
  "python",
  "ruby",
  "rust",
  "sql",
  "swift",
  "typescript",
  "xml",
  "yaml",
] as const;

const LANGUAGE_ALIASES: Record<string, (typeof SUPPORTED_LANGUAGES)[number]> = {
  bash: "bash",
  c: "c",
  "c#": "csharp",
  "c++": "cpp",
  cc: "cpp",
  cjs: "javascript",
  cpp: "cpp",
  cs: "csharp",
  cxx: "cpp",
  css: "css",
  go: "go",
  golang: "go",
  h: "c",
  html: "xml",
  hpp: "cpp",
  hxx: "cpp",
  javascript: "javascript",
  java: "java",
  js: "javascript",
  json: "json",
  jsx: "javascript",
  kt: "kotlin",
  kts: "kotlin",
  kotlin: "kotlin",
  markdown: "markdown",
  md: "markdown",
  plain: "plaintext",
  plaintext: "plaintext",
  php: "php",
  py: "python",
  python: "python",
  rb: "ruby",
  rs: "rust",
  ruby: "ruby",
  rust: "rust",
  rustm: "rust",
  sh: "bash",
  shell: "bash",
  sql: "sql",
  svg: "xml",
  swift: "swift",
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
  if (!hljs.getLanguage("c")) {
    hljs.registerLanguage("c", c);
  }
  if (!hljs.getLanguage("cpp")) {
    hljs.registerLanguage("cpp", cpp);
  }
  if (!hljs.getLanguage("csharp")) {
    hljs.registerLanguage("csharp", csharp);
  }
  if (!hljs.getLanguage("css")) {
    hljs.registerLanguage("css", css);
  }
  if (!hljs.getLanguage("go")) {
    hljs.registerLanguage("go", go);
  }
  if (!hljs.getLanguage("javascript")) {
    hljs.registerLanguage("javascript", javascript);
  }
  if (!hljs.getLanguage("java")) {
    hljs.registerLanguage("java", java);
  }
  if (!hljs.getLanguage("json")) {
    hljs.registerLanguage("json", json);
  }
  if (!hljs.getLanguage("kotlin")) {
    hljs.registerLanguage("kotlin", kotlin);
  }
  if (!hljs.getLanguage("markdown")) {
    hljs.registerLanguage("markdown", markdown);
  }
  if (!hljs.getLanguage("php")) {
    hljs.registerLanguage("php", php);
  }
  if (!hljs.getLanguage("plaintext")) {
    hljs.registerLanguage("plaintext", plaintext);
  }
  if (!hljs.getLanguage("python")) {
    hljs.registerLanguage("python", python);
  }
  if (!hljs.getLanguage("ruby")) {
    hljs.registerLanguage("ruby", ruby);
  }
  if (!hljs.getLanguage("rust")) {
    hljs.registerLanguage("rust", rust);
  }
  if (!hljs.getLanguage("sql")) {
    hljs.registerLanguage("sql", sql);
  }
  if (!hljs.getLanguage("swift")) {
    hljs.registerLanguage("swift", swift);
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
