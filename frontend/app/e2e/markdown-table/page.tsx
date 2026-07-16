import { MarkdownContent } from "@/shared/ui/markdown";

const markdown = `# Markdown table rendering

| 항목 | MCP 미사용 | OpenLog 활성 | 차이 |
|---|---:|---:|---:|
| **총 토큰** | 15,113 | 30,166 | +15,053 (+99.6%) |
| 입력 토큰 | 14,911 | 29,734 | +14,823 (+99.4%) |
| 캐시 입력 | 9,984 | 19,968 | +9,984 (+100.0%) |
| 출력 토큰 | 202 | 432 | +230 (+113.9%) |
| reasoning 출력 | 161 | 312 | +151 (+93.8%) |

The table keeps inline formatting and column alignment.
`;

export default function MarkdownTableE2EPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl bg-white px-5 py-12 sm:px-10">
      <MarkdownContent markdown={markdown} />
    </main>
  );
}
