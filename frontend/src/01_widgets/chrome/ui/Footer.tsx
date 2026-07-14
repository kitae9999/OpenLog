/** Legal / status pages are not ready yet — keep labels visible but non-navigable. */
const DISABLED_FOOTER_LINKS = ["Terms", "Privacy", "Status"] as const;

export function Footer() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto flex w-full max-w-[1083px] flex-wrap gap-6 px-4 py-8 text-sm text-zinc-500 sm:px-8">
        <span>© 2026 OpenLog. Collective Knowledge Platform.</span>
        {DISABLED_FOOTER_LINKS.map((label) => (
          <span key={label} className="cursor-default text-zinc-400">
            {label}
          </span>
        ))}
      </div>
    </footer>
  );
}
