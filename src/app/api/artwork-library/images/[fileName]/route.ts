import path from "node:path";

import { NextResponse } from "next/server";

import { getArtworkImageContentType, isSupportedArtworkImage } from "@/lib/artwork-library";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { fileName } = await context.params;
  const safeName = path.basename(decodeURIComponent(fileName));

  if (!isSupportedArtworkImage(safeName)) {
    return NextResponse.json({ ok: false, error: "Unsupported image type." }, { status: 400 });
  }

  const { data, error } = await getAdminClient().storage.from("artwork-library").download(safeName);

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "Image not found." }, { status: 404 });
  }

  return new Response(data, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": getArtworkImageContentType(safeName)
    }
  });
}
