import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  canUseLayoutEditor,
  isAllowedArtworkEmail,
  isArtworkServerAuthConfigured,
  isLocalArtworkHost
} from "@/lib/artwork-access";

let cachedArtworkAuthClient: SupabaseClient | null = null;

function getArtworkServerAuthClient() {
  if (cachedArtworkAuthClient) {
    return cachedArtworkAuthClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serverKey) {
    throw new Error("Missing Supabase artwork auth configuration.");
  }

  cachedArtworkAuthClient = createClient(url, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return cachedArtworkAuthClient;
}

function extractBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function verifyArtworkUser(request: Request) {
  if (!isArtworkServerAuthConfigured()) {
    const requestHost = new URL(request.url).hostname;

    if (process.env.NODE_ENV !== "production" || isLocalArtworkHost(requestHost)) {
      return { response: null as NextResponse | null, email: null as string | null };
    }

    return {
      response: NextResponse.json(
        { ok: false, error: "Artwork login is not configured for this deployment." },
        { status: 503 }
      ),
      email: null as string | null
    };
  }

  const token = extractBearerToken(request);
  if (!token) {
    return {
      response: NextResponse.json({ ok: false, error: "Please log in to access the artwork library." }, { status: 401 }),
      email: null as string | null
    };
  }

  const { data, error } = await getArtworkServerAuthClient().auth.getUser(token);
  const email = data.user?.email ?? null;

  if (error || !email) {
    return {
      response: NextResponse.json({ ok: false, error: "Your login session could not be verified." }, { status: 401 }),
      email: null as string | null
    };
  }

  if (!isAllowedArtworkEmail(email)) {
    return {
      response: NextResponse.json(
        { ok: false, error: "This account is not allowed to access the artwork generator." },
        { status: 403 }
      ),
      email: null as string | null
    };
  }

  return { response: null as NextResponse | null, email };
}

export async function requireArtworkApiAccess(request: Request) {
  const verified = await verifyArtworkUser(request);
  return { response: verified.response };
}

export async function requireArtworkTemplateEditorAccess(request: Request) {
  const verified = await verifyArtworkUser(request);

  if (verified.response) {
    return { response: verified.response, email: null as string | null };
  }

  if (!isArtworkServerAuthConfigured()) {
    return {
      response: NextResponse.json(
        { ok: false, error: "Supabase login is required before templates can be published." },
        { status: 503 }
      ),
      email: null as string | null
    };
  }

  if (!canUseLayoutEditor(verified.email)) {
    return {
      response: NextResponse.json(
        { ok: false, error: "This account is not allowed to edit the published artwork template." },
        { status: 403 }
      ),
      email: null as string | null
    };
  }

  return { response: null as NextResponse | null, email: verified.email };
}
