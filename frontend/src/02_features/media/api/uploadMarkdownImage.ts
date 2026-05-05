const MAX_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_POST_IMAGE_WIDTH = 1600;
const WEBP_QUALITY = 0.84;
const SUPPORTED_SOURCE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type UploadPurpose = "POST_BODY_IMAGE";

type UploadUrlResponse = {
  assetId?: string | number;
  uploadUrl: string;
  assetUrl?: string;
  imageUrl?: string;
  markdownUrl?: string;
  publicUrl?: string;
  objectKey?: string;
  headers?: Record<string, string>;
};

export type UploadedMarkdownImage = {
  assetId?: string;
  markdownUrl: string;
  altText: string;
};

export async function uploadMarkdownImage(file: File) {
  const prepared = await preparePostImageFile(file);
  const uploadTarget = await requestUploadUrl(prepared.file, {
    purpose: "POST_BODY_IMAGE",
    originalFileName: file.name,
  });

  const uploadResponse = await fetch(uploadTarget.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": prepared.file.type,
      ...uploadTarget.headers,
    },
    body: prepared.file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Image upload failed.");
  }

  const markdownUrl = getMarkdownUrl(uploadTarget);
  if (!markdownUrl) {
    throw new Error("Upload completed without an image URL.");
  }

  return {
    assetId:
      uploadTarget.assetId === undefined ? undefined : String(uploadTarget.assetId),
    markdownUrl,
    altText: prepared.altText,
  } satisfies UploadedMarkdownImage;
}

export function getUploadImageAltText(file: File) {
  return stripExtension(file.name.trim()).replace(/[_-]+/g, " ") || "image";
}

async function requestUploadUrl(
  file: File,
  {
    purpose,
    originalFileName,
  }: {
    purpose: UploadPurpose;
    originalFileName: string;
  },
) {
  const response = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      originalFileName,
      contentType: file.type,
      sizeBytes: file.size,
      purpose,
    }),
  });

  if (!response.ok) {
    throw new Error("Could not create an image upload URL.");
  }

  const data = (await response.json()) as UploadUrlResponse;
  if (!data.uploadUrl) {
    throw new Error("Upload URL response is missing uploadUrl.");
  }

  return data;
}

async function preparePostImageFile(file: File) {
  validateSourceImage(file);

  const altText = getUploadImageAltText(file);
  const image = await loadImage(file);
  const scale = Math.min(1, MAX_POST_IMAGE_WIDTH / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("This browser cannot process images.");
  }

  context.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas);

  return {
    altText,
    file: new File([blob], `${sanitizeFileStem(altText)}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    }),
  };
}

function validateSourceImage(file: File) {
  if (!SUPPORTED_SOURCE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP, and AVIF images can be uploaded.");
  }

  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };

    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not convert image to WebP."));
          return;
        }

        resolve(blob);
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

function getMarkdownUrl(uploadTarget: UploadUrlResponse) {
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
    return `/api/media/assets/${encodeURIComponent(String(uploadTarget.assetId))}`;
  }

  return undefined;
}

function sanitizeFileStem(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "image";
}

function stripExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "");
}
