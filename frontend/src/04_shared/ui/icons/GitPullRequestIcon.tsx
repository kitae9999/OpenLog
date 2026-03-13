import { cn } from "@/shared/lib/cn";

const pullRequestMaskStyle = {
  WebkitMask: "url('/GitPullRequest.svg') center / contain no-repeat",
  mask: "url('/GitPullRequest.svg') center / contain no-repeat",
} as const;

export function GitPullRequestIcon({
  className,
}: {
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 bg-current align-middle", className)}
      style={pullRequestMaskStyle}
    />
  );
}
