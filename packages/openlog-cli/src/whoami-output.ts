import { dim, heading, kv } from "./cli-ui.js";

export type WhoamiOutputOptions = {
  asJson?: boolean;
  forceHuman?: boolean;
  isTTY?: boolean;
};

export function formatWhoamiOutput(
  me: Record<string, unknown>,
  options: WhoamiOutputOptions = {},
): string {
  const shouldPrintJson =
    options.asJson === true ||
    (options.forceHuman !== true && options.isTTY !== true);

  if (shouldPrintJson) {
    return JSON.stringify(me, null, 2);
  }

  const name =
    pickString(me, "nickname") ??
    pickString(me, "username") ??
    pickString(me, "name") ??
    "OpenLog user";
  const username = pickString(me, "username");
  const email = pickString(me, "email");
  const id = pickScalar(me, "id") ?? pickScalar(me, "userId");

  return [
    heading("Signed in"),
    kv("Name", name),
    ...(username ? [kv("Username", `@${username}`)] : []),
    ...(email ? [kv("Email", email)] : []),
    ...(id ? [kv("Id", id)] : []),
    dim("Tip: pass --json for machine-readable output."),
  ].join("\n");
}

function pickString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const next = value[key];
  return typeof next === "string" && next.trim().length > 0 ? next : undefined;
}

function pickScalar(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const next = value[key];
  if (typeof next === "number" && Number.isFinite(next)) {
    return String(next);
  }
  return typeof next === "string" && next.trim().length > 0 ? next : undefined;
}
