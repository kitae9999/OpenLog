import Link from "next/link";

export function ContributeCard() {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-800 p-6 text-white shadow-sm">
      <h2 className="text-[18px] font-semibold tracking-tight">
        Contribute to OpenLog
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/75">
        Found an error? Improve technical documentation and build your
        portfolio.
      </p>
      <Link
        href="/contribute"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        Start Contributing <IconArrowRight className="size-4" />
      </Link>
    </section>
  );
}

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
