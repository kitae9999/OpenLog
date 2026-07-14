import Image from "next/image";
import {
  OPENLOG_MARK_ASSET,
  OPENLOG_WORDMARK_ASSET,
} from "@/shared/config/brand";
import { cn } from "@/shared/lib/cn";

type OpenLogLogoProps = {
  variant?: "wordmark" | "mark";
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  sizes?: string;
};

export function OpenLogLogo({
  variant = "wordmark",
  className,
  priority = false,
  decorative = false,
  sizes,
}: OpenLogLogoProps) {
  const alt = decorative ? "" : "OpenLog";

  if (variant === "mark") {
    return (
      <span
        className={cn("relative inline-block shrink-0", className)}
        aria-hidden={decorative || undefined}
      >
        <Image
          src={OPENLOG_MARK_ASSET}
          alt={alt}
          fill
          sizes={sizes ?? "48px"}
          priority={priority}
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-block aspect-[1141/287] shrink-0 overflow-hidden",
        className,
      )}
      aria-hidden={decorative || undefined}
    >
      <Image
        src={OPENLOG_WORDMARK_ASSET}
        alt={alt}
        width={1774}
        height={887}
        sizes={sizes ?? "136px"}
        priority={priority}
        className="absolute max-w-none"
        style={{
          width: "155.48%",
          height: "309.06%",
          left: "-29.19%",
          top: "-102.09%",
        }}
      />
    </span>
  );
}
