import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { requireArtworkApiAccess } from "@/lib/artwork-api-auth";
import {
  artworkLibraryPath,
  getArtworkImageContentType,
  isSupportedArtworkImage
} from "@/lib/artwork-library";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const access = await requireArtworkApiAccess(request);
  if (access.response) {
    return access.response;
  }

  const { fileName } = await context.params;
  const safeName = path.basename(decodeURIComponent(fileName));

  if (!isSupportedArtworkImage(safeName)) {
    return NextResponse.json({ ok: false, error: "Unsupported image type." }, { status: 400 });
  }

  const resolvedPath = path.resolve(artworkLibraryPath, safeName);
  const resolvedFolder = path.resolve(artworkLibraryPath);

  if (!resolvedPath.startsWith(`${resolvedFolder}${path.sep}`)) {
    return NextResponse.json({ ok: false, error: "Invalid image path." }, { status: 400 });
  }

  try {
    const file = await readFile(resolvedPath);

    return new Response(file, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": getArtworkImageContentType(safeName)
      }
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Image not found." }, { status: 404 });
  }
}
