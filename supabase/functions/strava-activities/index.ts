import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  if (!claims?.claims) return json({ error: "Unauthorized" }, 401);
  const userId = claims.claims.sub as string;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: conn, error: connErr } = await admin
    .from("strava_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (connErr) return json({ error: connErr.message }, 500);
  if (!conn) return json({ connected: false, activities: [] });

  let accessToken = conn.access_token as string;
  const expiresAt = new Date(conn.expires_at as string).getTime();

  // Refresh if expired or about to (60s buffer)
  if (Date.now() > expiresAt - 60_000) {
    const refreshRes = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: Deno.env.get("STRAVA_CLIENT_ID"),
        client_secret: Deno.env.get("STRAVA_CLIENT_SECRET"),
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
      }),
    });
    if (!refreshRes.ok) return json({ error: "Failed to refresh Strava token" }, 502);
    const refreshed = await refreshRes.json();
    accessToken = refreshed.access_token;
    await admin.from("strava_connections").update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: new Date(refreshed.expires_at * 1000).toISOString(),
    }).eq("user_id", userId);
  }

  const url = new URL(req.url);
  const perPage = Math.min(Number(url.searchParams.get("per_page") ?? 30), 100);
  const actRes = await fetch(`https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!actRes.ok) {
    const text = await actRes.text();
    return json({ error: "Strava API error", details: text }, 502);
  }
  const activities = await actRes.json();
  const mapped = (activities as any[]).map((a) => ({
    id: a.id,
    name: a.name,
    sport_type: a.sport_type ?? a.type,
    start_date: a.start_date_local ?? a.start_date,
    duration_minutes: Math.round((a.moving_time ?? 0) / 60),
    calories: a.calories ?? a.kilojoules ? Math.round(a.kilojoules ?? 0) : null,
    distance_km: a.distance ? Math.round((a.distance / 1000) * 10) / 10 : null,
  }));

  return json({ connected: true, activities: mapped });
});