export function todayIso(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function todayShortLabel(date = new Date()) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(date);
}
