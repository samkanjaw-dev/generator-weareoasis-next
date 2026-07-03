import path from "node:path";

export const artworkLibraryPath = path.join(process.cwd(), "artwork-library");

export const supportedArtworkImageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp"
]);

export function isSupportedArtworkImage(fileName: string) {
  return supportedArtworkImageExtensions.has(path.extname(fileName).toLowerCase());
}

export function getArtworkImageContentType(fileName: string) {
  switch (path.extname(fileName).toLowerCase()) {
    case ".avif":
      return "image/avif";
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
