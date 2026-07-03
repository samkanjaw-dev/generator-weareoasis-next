import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireArtworkApiAccess } from "@/lib/artwork-api-auth";
import { artworkLibraryPath, isSupportedArtworkImage } from "@/lib/artwork-library";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const access = await requireArtworkApiAccess(request);
  if (access.response) {
    return access.response;
  }

  await mkdir(artworkLibraryPath, { recursive: true });

  const entries = await readdir(artworkLibraryPath, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && isSupportedArtworkImage(entry.name))
      .map(async (entry) => {
        const fileStats = await stat(path.join(artworkLibraryPath, entry.name));

        return {
          name: entry.name,
          size: fileStats.size,
          updatedAt: fileStats.mtimeMs,
          src: `/api/artwork-library/images/${encodeURIComponent(entry.name)}?v=${Math.round(fileStats.mtimeMs)}`
        };
      })
  );

  files.sort((left, right) => left.name.localeCompare(right.name));

  return NextResponse.json({
    ok: true,
    folder: "artwork-library",
    count: files.length,
    images: files
  });
}
