/** Short month+day label in Asia/Seoul (e.g. "Jul 14"). */
export function formatWorkspaceDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(date);
}

/** Return the chronologically latest ISO timestamp, or undefined if none parse. */
export function pickLatestIso(values: Array<string | undefined | null>) {
  let latest: string | undefined;
  let latestMs = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) continue;
    if (ms >= latestMs) {
      latestMs = ms;
      latest = value;
    }
  }

  return latest;
}
