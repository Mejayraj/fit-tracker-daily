import { corsHeaders, json } from "../_shared/hevy.ts";
import { requireUser, adminClient } from "../_shared/hevy-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const userId = await requireUser(req);
  if (!userId) return json({ connected: false }, 401);
  const admin = adminClient();
  const { data } = await admin
    .from("hevy_connections")
    .select("username, last_synced_at")
    .eq("user_id", userId)
    .maybeSingle();
  return json({
    connected: !!data,
    username: data?.username ?? null,
    lastSyncedAt: data?.last_synced_at ?? null,
  });
});
