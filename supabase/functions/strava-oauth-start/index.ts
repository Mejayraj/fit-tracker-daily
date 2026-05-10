import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data, error } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
    if (error || !data?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userId = data.claims.sub as string;
    const clientId = Deno.env.get("STRAVA_CLIENT_ID");
    if (!clientId) return new Response(JSON.stringify({ error: "STRAVA_CLIENT_ID not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const origin = body.origin as string | undefined;
    if (!origin) return new Response(JSON.stringify({ error: "origin required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const projectId = Deno.env.get("SUPABASE_URL")!.split("//")[1].split(".")[0];
    const redirectUri = `https://${projectId}.supabase.co/functions/v1/strava-oauth-callback`;
    // state encodes user id + return origin
    const state = btoa(JSON.stringify({ u: userId, o: origin }));
    const url = new URL("https://www.strava.com/oauth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("approval_prompt", "auto");
    url.searchParams.set("scope", "read,activity:read_all,profile:read_all");
    url.searchParams.set("state", state);

    return new Response(JSON.stringify({ url: url.toString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});