import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const html = (msg: string, redirect?: string) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><title>Strava</title><body style="font-family:system-ui;padding:24px;background:#0a0a0a;color:#fff"><p>${msg}</p>${redirect ? `<script>setTimeout(()=>location.href=${JSON.stringify(redirect)},800)</script>` : ""}</body>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

  try {
    if (error) return html(`Strava connection cancelled: ${error}`);
    if (!code || !stateRaw) return html("Missing code or state.");
    const state = JSON.parse(atob(stateRaw)) as { u: string; o: string };

    const clientId = Deno.env.get("STRAVA_CLIENT_ID");
    const clientSecret = Deno.env.get("STRAVA_CLIENT_SECRET");
    if (!clientId || !clientSecret) return html("Strava credentials not configured.");

    const tokRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: "authorization_code" }),
    });
    const tok = await tokRes.json();
    if (!tokRes.ok) return html(`Token exchange failed: ${JSON.stringify(tok)}`);

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
    if (upErr) return html(`Failed to save connection: ${upErr.message}`);

    return html("Strava connected! Redirecting…", `${state.o}/?strava=connected`);
  } catch (e) {
    return html(`Error: ${e instanceof Error ? e.message : "unknown"}`);
  }
});
