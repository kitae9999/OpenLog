import { stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { OpenLogApiClient } from "./api-client.js";

const MAX_POST_IMAGE_WIDTH = 1600;
const MAX_WEBP_BYTES = 10 * 1024 * 1024;
const WEBP_QUALITY = 84;

type UploadUrlResponse = {
  assetId: string | number;
  uploadUrl: string;
  markdownUrl?: string;
  assetUrl?: string;
  imageUrl?: string;
  publicUrl?: string;
  headers?: Record<string, string>;
};

export type UploadedPostImage = {
  assetId: string;
  markdownUrl: string;
  markdown: string;
  altText: string;
  originalFileName: string;
  webpSizeBytes: number;
};

export async function uploadPostImage(
  client: OpenLogApiClient,
  {
    filePath,
    altText,
  }: {
    filePath: string;
    altText?: string;
  },
): Promise<UploadedPostImage> {
  const resolvedPath = resolveLocalPath(filePath);
  const originalFileName = path.basename(resolvedPath);
  const resolvedAltText = normalizeAltText(altText, originalFileName);

  await assertReadableFile(resolvedPath);

  const webp = await createWebpPostImage(resolvedPath);
  if (webp.byteLength > MAX_WEBP_BYTES) {
    throw new Error("Converted image must be 10 MB or smaller.");
  }

  const uploadTarget = await client.post<UploadUrlResponse>("/media/upload-url", {
    fileName: `${sanitizeFileStem(resolvedAltText)}.webp`,
    originalFileName,
    contentType: "image/webp",
    sizeBytes: webp.byteLength,
    purpose: "POST_BODY_IMAGE",
  });

  await putImage(uploadTarget, webp);

  const assetId = String(uploadTarget.assetId);
  await client.patchNoContent(
    `/media/assets/${encodeURIComponent(assetId)}/completion`,
  );

  const markdownUrl = getMarkdownUrl(uploadTarget);
  if (!markdownUrl) {
    throw new Error("Upload completed without a markdown image URL.");
  }

  return {
    assetId,
    markdownUrl,
    markdown: `![${escapeMarkdownAltText(resolvedAltText)}](${markdownUrl})`,
    altText: resolvedAltText,
    originalFileName,
    webpSizeBytes: webp.byteLength,
  };
}

function resolveLocalPath(filePath: string): string {
  const trimmedPath = filePath.trim();
  if (!trimmedPath) {
    throw new Error("filePath is required.");
  }

  return path.isAbsolute(trimmedPath)
    ? trimmedPath
    : path.resolve(process.cwd(), trimmedPath);
}

async function assertReadableFile(filePath: string): Promise<void> {
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    throw new Error(`Image file does not exist: ${filePath}`);
  }

  if (!fileStat.isFile()) {
    throw new Error(`Image path is not a file: ${filePath}`);
  }
}

async function createWebpPostImage(filePath: string): Promise<Buffer> {
  try {
    return await sharp(filePath)
      .rotate()
      .resize({
        width: MAX_POST_IMAGE_WIDTH,
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(`Could not convert image to WebP.${detail}`);
  }
}

async function putImage(
  uploadTarget: UploadUrlResponse,
  webp: Buffer,
): Promise<void> {
  const response = await fetch(uploadTarget.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "image/webp",
      ...(uploadTarget.headers ?? {}),
    },
    body: new Uint8Array(webp),
  });

  if (!response.ok) {
    throw new Error(
      `Image upload failed with ${response.status}: ${await readResponseText(response)}`,
    );
  }
}

async function readResponseText(response: Response): Promise<string> {
  const text = await response.text().catch(() => "");
  return text.trim() || response.statusText || "No response body";
}

function getMarkdownUrl(uploadTarget: UploadUrlResponse): string | undefined {
  if (uploadTarget.markdownUrl) {
    return uploadTarget.markdownUrl;
  }

  if (uploadTarget.assetUrl) {
    return uploadTarget.assetUrl;
  }

  if (uploadTarget.imageUrl) {
    return uploadTarget.imageUrl;
  }

  if (uploadTarget.publicUrl) {
    return uploadTarget.publicUrl;
  }

  if (uploadTarget.assetId !== undefined) {
    return `/media/assets/${encodeURIComponent(String(uploadTarget.assetId))}`;
  }

  return undefined;
}

function normalizeAltText(
  providedAltText: string | undefined,
  originalFileName: string,
): string {
  const normalized = (providedAltText ?? "")
    .trim()
    .replace(/[\r\n]+/g, " ");

  if (normalized) {
    return normalized;
  }

  return stripExtension(originalFileName).replace(/[_-]+/g, " ").trim() || "image";
}

function sanitizeFileStem(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "");
}

function escapeMarkdownAltText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/[\r\n]+/g, " ");
}
