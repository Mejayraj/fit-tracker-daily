import { corsHeaders, json, hevyFetch } from "../_shared/hevy.ts";
import { requireUser, adminClient } from "../_shared/hevy-auth.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userId = await requireUser(req);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    if (!apiKey || apiKey.length < 10 || apiKey.length > 200) {
      return json({ error: "Enter a valid Hevy API key" }, 400);
    }

    let username: string | null = null;
    try {
      const info = await hevyFetch(apiKey, "/v1/user/info");
      username = info?.username ?? info?.user?.username ?? null;
    } catch (e) {
      return json({ error: `Hevy rejected that key: ${(e as Error).message}` }, 400);
    }

    const admin = adminClient();
    const { error } = await admin
      .from("hevy_connections")
      .upsert({ user_id: userId, api_key: apiKey, username }, { onConflict: "user_id" });
    if (error) return json({ error: error.message }, 500);

    return json({ connected: true, username });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
