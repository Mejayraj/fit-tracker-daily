import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { escapeHtml, isAllowedOrigin, verifyState } from "../_shared/strava-state.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const html = (msg: string, redirect?: string) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><title>Strava</title><body style="font-family:system-ui;padding:24px;background:#0a0a0a;color:#fff"><p>${escapeHtml(msg)}</p>${redirect ? `<script>setTimeout(()=>location.href=${JSON.stringify(redirect)},800)</script>` : ""}</body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  try {
    if (error) return html("Strava connection was cancelled or denied.");
    if (!code || !stateRaw) return html("Missing code or state.");

    const stateSecret = Deno.env.get("STRAVA_STATE_SECRET");
    if (!stateSecret) return html("Strava is not configured correctly.");
    const state = await verifyState(stateRaw, stateSecret);
    if (!state) return html("Invalid or expired Strava authorization request. Please try connecting again.");
    if (!isAllowedOrigin(state.o)) return html("Invalid redirect target.");

    const clientId = Deno.env.get("STRAVA_CLIENT_ID");
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
    if (!clientId || !clientSecret) return html("Strava credentials not configured.");

    const tokRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
    });
    const tok = await tokRes.json();
    if (!tokRes.ok) {
      console.error("Strava token exchange failed", tok);
      return html("Could not complete the Strava connection. Please try again.");
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: upErr } = await admin.from("strava_connections").upsert({
      user_id: state.u,
      athlete_id: tok.athlete?.id,
      athlete_firstname: tok.athlete?.firstname ?? null,
      athlete_lastname: tok.athlete?.lastname ?? null,
      access_token: tok.access_token,
      refresh_token: tok.refresh_token,
      expires_at: new Date(tok.expires_at * 1000).toISOString(),
      scope: url.searchParams.get("scope") ?? null,
    }, { onConflict: "user_id" });
    if (upErr) {
      console.error("Failed to save Strava connection", upErr);
      return html("Failed to save your Strava connection. Please try again.");
    }

    return html("Strava connected! Redirecting…", `${state.o}/?strava=connected`);
  } catch (e) {
    console.error("Strava callback error", e);
    return html("Something went wrong connecting Strava. Please try again.");
  }
});
