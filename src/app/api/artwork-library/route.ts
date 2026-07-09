import { NextResponse } from "next/server";

import { isSupportedArtworkImage } from "@/lib/artwork-library";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const bucketName = "artwork-library";

type LibraryImage = {
  name: string;
  src: string;
  size: number;
  updatedAt: number;
};

async function listStorageImages(folder = ""): Promise<LibraryImage[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.storage.from(bucketName).list(folder, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" }
  });

  if (error) {
    throw error;
  }

  const images: LibraryImage[] = [];

  for (const item of data ?? []) {
    const itemPath = folder ? `${folder}/${item.name}` : item.name;

    if (item.id === null) {
      images.push(...(await listStorageImages(itemPath)));
      continue;
    }

    if (!isSupportedArtworkImage(item.name)) {
      continue;
    }

    const updatedAt = item.updated_at ? new Date(item.updated_at).getTime() : Date.now();

    images.push({
      name: itemPath,
      size: item.metadata?.size ?? 0,
      updatedAt,
      src: `/api/artwork-library/images?path=${encodeURIComponent(itemPath)}&v=${Math.round(updatedAt)}`
    });
  }

  return images;
}

export async function GET() {
  try {
    const images = await listStorageImages();
    images.sort((left, right) => left.name.localeCompare(right.name));

    return NextResponse.json({
      ok: true,
      folder: bucketName,
      count: images.length,
      images
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "The artwork library could not be loaded."
      },
      { status: 500 }
    );
  }
}
