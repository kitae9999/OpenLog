import Link from "next/link";
import { recommendedTopics } from "./data";

export function RecommendedTopics() {
  return (
    <section>
      <h2 className="text-xs font-semibold tracking-wider text-zinc-400">
        RECOMMENDED TOPICS
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {recommendedTopics.map((topic) => (
          <Link
            key={topic}
            href={`/topics/${encodeURIComponent(topic.toLowerCase())}`}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
          >
            {topic}
          </Link>
        ))}
      </div>
    </section>
  );
}
