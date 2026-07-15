import { MarkdownContent } from "@/shared/ui/markdown";

const markdown = `# Mermaid rendering

The same MarkdownContent renders diagrams and ordinary code.

\`\`\`mermaid
flowchart LR
  A[Markdown] --> B[Parse]
  B --> C[Lazy load]
  C --> D[Render SVG]
  D --> E[Sanitize]
  E --> F[Responsive view]
  F --> G[Done]
\`\`\`

\`\`\`mermaid
flowchart TD
  Safe["<img src=x onerror=window.__openlogMermaidXss=true>"] --> Encoded[Strict labels]
\`\`\`

\`\`\`mermaid
flowchart TD
  A[Broken
\`\`\`

\`\`\`typescript
const ordinaryCode = "still highlighted";
\`\`\`
`;

export default function MarkdownMermaidE2EPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-5 py-12 sm:px-10">
      <MarkdownContent markdown={markdown} />
    </main>
  );
}
