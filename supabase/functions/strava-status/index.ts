import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "@supabase/supabase-js";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return new Response(JSON.stringify({ connected: false }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: claims } = await supabase.auth.getClaims(auth.replace("Bearer ", ""));
  if (!claims?.claims) return new Response(JSON.stringify({ connected: false }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const { data } = await supabase.from("strava_connections").select("athlete_id, athlete_firstname, athlete_lastname").eq("user_id", claims.claims.sub).maybeSingle();
  return new Response(JSON.stringify({
    connected: !!data,
    athlete: data ? { id: data.athlete_id, firstname: data.athlete_firstname, lastname: data.athlete_lastname } : null,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});