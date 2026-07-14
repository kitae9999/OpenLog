import { pathToFileURL } from "node:url";

function parseStableVersion(version, label) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`${label} must be a stable semantic version: ${version}`);
  }

  return match.slice(1).map(Number);
}

function compareVersions(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function resolveReleaseVersion(requestedVersion, latestVersion) {
  const requested = parseStableVersion(requestedVersion, "requestedVersion");
  if (!latestVersion) {
    return requestedVersion;
  }

  const latest = parseStableVersion(latestVersion, "latestVersion");
  if (compareVersions(requested, latest) > 0) {
    return requestedVersion;
  }

  return `${latest[0]}.${latest[1]}.${latest[2] + 1}`;
}

const isCommand =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCommand) {
  try {
    const version = resolveReleaseVersion(process.argv[2], process.argv[3]);
    process.stdout.write(`${version}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
    process.exitCode = 1;
  }
}
