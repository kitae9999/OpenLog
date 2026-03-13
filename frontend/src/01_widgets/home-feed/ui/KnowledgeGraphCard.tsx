import Image from "next/image";
import { openLogAssets } from "@/shared/config/openLogAssets";

export function KnowledgeGraphCard() {
  return (
    <section className="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 text-[16px] font-semibold tracking-tight text-zinc-950">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Knowledge Graph
      </h2>

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          Knowledge Graph Visualization
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <Image
          src={openLogAssets.knowledgeGraph}
          alt="Knowledge graph preview"
          width={280}
          height={190}
          className="mx-auto h-auto w-full max-w-[280px]"
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-500">
        Visualize how topics are interconnected across the platform. Click nodes
        to explore.
      </p>
    </section>
  );
}
