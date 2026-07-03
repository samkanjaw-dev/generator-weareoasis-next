"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import {
  canCreateArtworkAccounts,
  canUseLayoutEditor,
  getArtworkAllowedDomainLabel,
  isAllowedArtworkEmail,
  isLocalArtworkHost,
  isArtworkBrowserAuthConfigured
} from "@/lib/artwork-access";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ArtworkAuthContext = {
  accessToken: string | null;
  userEmail: string | null;
  canEditLayout: boolean;
};

type ArtworkAuthGateProps = {
  children: ReactNode | ((context: ArtworkAuthContext) => ReactNode);
};

type AuthMode = "sign-in" | "create-account";

const authConfigured = isArtworkBrowserAuthConfigured();
const allowedDomainLabel = getArtworkAllowedDomainLabel();
const accountCreationEnabled = canCreateArtworkAccounts();

function renderChildren(children: ArtworkAuthGateProps["children"], context: ArtworkAuthContext) {
  return typeof children === "function" ? children(context) : children;
}

function sessionContext(user: User | null, accessToken: string | null): ArtworkAuthContext {
  const userEmail = user?.email ?? null;

  return {
    accessToken,
    userEmail,
    canEditLayout: canUseLayoutEditor(userEmail)
  };
}

export function ArtworkAuthGate({ children }: ArtworkAuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [localAuthBypass, setLocalAuthBypass] = useState(!authConfigured && process.env.NODE_ENV !== "production");

  const context = useMemo(() => sessionContext(user, accessToken), [accessToken, user]);

  useEffect(() => {
    if (!authConfigured && typeof window !== "undefined" && isLocalArtworkHost(window.location.hostname)) {
      setLocalAuthBypass(true);
      setLoading(false);
      return;
    }

    if (!authConfigured) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    const applySession = async (nextUser: User | null, nextAccessToken: string | null) => {
      const nextEmail = nextUser?.email ?? null;

      if (nextEmail && !isAllowedArtworkEmail(nextEmail)) {
        await supabase.auth.signOut();

        if (!active) {
          return;
        }

        setUser(null);
        setAccessToken(null);
        setError(`Use an ${allowedDomainLabel} email address to access this tool.`);
        return;
      }

      setUser(nextUser);
      setAccessToken(nextAccessToken);
    };

    void supabase.auth.getSession().then(async ({ data, error: sessionError }) => {
      if (!active) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      await applySession(data.session?.user ?? null, data.session?.access_token ?? null);

      if (active) {
        setLoading(false);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      void applySession(session?.user ?? null, session?.access_token ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    setError("");
    setMessage("");

    if (!isAllowedArtworkEmail(normalizedEmail)) {
      setError(`Use an ${allowedDomainLabel} email address.`);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "create-account" && !accountCreationEnabled) {
      setError("Account creation is restricted. Ask the campaign admin to create your account.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "create-account") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/artwork-generator`
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (!data.session) {
          setMessage("Account created. Check your email to confirm it, then log in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });

        if (signInError) {
          throw signInError;
        }
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (!authConfigured) {
      return;
    }

    setSubmitting(true);
    try {
      await getSupabaseBrowserClient().auth.signOut();
      setUser(null);
      setAccessToken(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (!authConfigured && localAuthBypass) {
    return (
      <>
        <div className="artwork-auth-dev-banner">
          Local auth bypass is active because Supabase browser auth is not configured.
        </div>
        {renderChildren(children, context)}
      </>
    );
  }

  if (!authConfigured) {
    return (
      <main className="artwork-auth-page">
        <section className="artwork-auth-card">
          <p className="artwork-auth-eyebrow">Campaign artwork generator</p>
          <h1>Login is not configured</h1>
          <p>
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to
            this deployment before sharing the live generator.
          </p>
        </section>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="artwork-auth-page">
        <section className="artwork-auth-card artwork-auth-card-compact" role="status">
          <span className="mosaic-loading-spinner" aria-hidden="true" />
          <p>Checking your login...</p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <>
        <div className="artwork-auth-session-bar">
          <span>Signed in as {user.email}</span>
          <button type="button" onClick={() => void handleSignOut()} disabled={submitting}>
            Sign out
          </button>
        </div>
        {renderChildren(children, context)}
      </>
    );
  }

  return (
    <main className="artwork-auth-page">
      <section className="artwork-auth-card">
        <p className="artwork-auth-eyebrow">Campaign artwork generator</p>
        <h1>Log in to create artwork</h1>
        <p className="artwork-auth-copy">
          Use your Oasis or Solvo work account. Access is limited to {allowedDomainLabel} email addresses.
        </p>

        {accountCreationEnabled ? (
          <div className="artwork-auth-tabs" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === "sign-in" ? "is-active" : ""}
              onClick={() => {
                setMode("sign-in");
                setError("");
                setMessage("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={mode === "create-account" ? "is-active" : ""}
              onClick={() => {
                setMode("create-account");
                setError("");
                setMessage("");
              }}
            >
              Create account
            </button>
          </div>
        ) : (
          <p className="artwork-auth-admin-note">Accounts are created by the campaign admin.</p>
        )}

        <form className="artwork-auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@oasisoutsourcing.co.ke"
              autoComplete="email"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </label>

          {error ? <p className="artwork-auth-error">{error}</p> : null}
          {message ? <p className="artwork-auth-message">{message}</p> : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "sign-in" ? "Log in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
