import { NextResponse } from "next/server";

import { requireArtworkApiAccess, requireArtworkTemplateEditorAccess } from "@/lib/artwork-api-auth";
import { isArtworkServerAuthConfigured } from "@/lib/artwork-access";
import { getAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const templateId = "default";

export async function GET(request: Request) {
  const access = await requireArtworkApiAccess(request);
  if (access.response) {
    return access.response;
  }

  if (!isArtworkServerAuthConfigured()) {
    return NextResponse.json({ ok: true, config: null });
  }

  const { data, error } = await getAdminClient()
    .from("artwork_templates")
    .select("config,updated_at,updated_by")
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Published artwork template storage is not ready." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    ok: true,
    config: data?.config ?? null,
    updatedAt: data?.updated_at ?? null,
    updatedBy: data?.updated_by ?? null
  });
}

export async function PUT(request: Request) {
  const access = await requireArtworkTemplateEditorAccess(request);
  if (access.response) {
    return access.response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid template payload." }, { status: 400 });
  }

  const config = typeof body === "object" && body !== null && "config" in body ? body.config : null;

  if (!config || typeof config !== "object") {
    return NextResponse.json({ ok: false, error: "Template config is required." }, { status: 400 });
  }

  const { error } = await getAdminClient().from("artwork_templates").upsert({
    id: templateId,
    config,
    updated_by: access.email,
    updated_at: new Date().toISOString()
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: "Published artwork template storage is not ready." },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true });
}
