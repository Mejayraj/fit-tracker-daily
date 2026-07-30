import { corsHeaders, json } from "../_shared/hevy.ts";
import { requireUser, adminClient } from "../_shared/hevy-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const userId = await requireUser(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);
  const admin = adminClient();
  await admin.from("hevy_connections").delete().eq("user_id", userId);
  await admin.from("hevy_workouts").delete().eq("user_id", userId);
  return json({ connected: false });
});
