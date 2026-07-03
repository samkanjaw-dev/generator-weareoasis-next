export const artworkAllowedEmailDomains = ["oasisoutsourcing.co.ke", "solvoglobal.com"];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAllowedArtworkEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const domain = normalizeEmail(email).split("@").pop();
  return Boolean(domain && artworkAllowedEmailDomains.includes(domain));
}

export function getArtworkAllowedDomainLabel() {
  return artworkAllowedEmailDomains.map((domain) => `@${domain}`).join(" or ");
}

export function isArtworkBrowserAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isArtworkServerAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isLocalArtworkHost(hostname: string | null | undefined) {
  if (!hostname) {
    return false;
  }

  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname.toLowerCase());
}

export function getLayoutEditorEmails() {
  return (process.env.NEXT_PUBLIC_LAYOUT_EDITOR_EMAILS ?? "")
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

export function canCreateArtworkAccounts() {
  const signupFlag = process.env.NEXT_PUBLIC_ALLOW_ARTWORK_SIGNUPS;

  if (process.env.NODE_ENV !== "production" && signupFlag !== "false") {
    return true;
  }

  return signupFlag === "true";
}

export function canUseLayoutEditor(email: string | null | undefined) {
  const editorFlag = process.env.NEXT_PUBLIC_ENABLE_LAYOUT_EDITOR;

  if (process.env.NODE_ENV !== "production" && editorFlag !== "false") {
    return true;
  }

  if (editorFlag !== "true") {
    return false;
  }

  const editorEmails = getLayoutEditorEmails();
  if (!email || editorEmails.length === 0) {
    return false;
  }

  return editorEmails.includes(normalizeEmail(email));
}
