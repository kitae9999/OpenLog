export function formatPostVersionLabel(version: number) {
  return version === 0 ? "base" : `v${version}`;
}
