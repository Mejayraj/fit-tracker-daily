import { corsHeaders, json, hevyFetch, summarizeWorkout } from "../_shared/hevy.ts";
import { requireUser, adminClient } from "../_shared/hevy-auth.ts";

const DEFAULT_BW = 70;
const MAX_PAGES = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userId = await requireUser(req);
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const admin = adminClient();
    const { data: conn } = await admin
      .from("hevy_connections")
      .select("api_key")
      .eq("user_id", userId)
      .maybeSingle();
    if (!conn?.api_key) return json({ error: "Hevy is not connected" }, 400);

    const { data: profile } = await admin
      .from("profiles")
      .select("body_weight_kg")
      .eq("id", userId)
      .maybeSingle();
    const bw = Number(profile?.body_weight_kg) > 0 ? Number(profile!.body_weight_kg) : DEFAULT_BW;

    const rows: Record<string, unknown>[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const data = await hevyFetch(conn.api_key, `/v1/workouts?page=${page}&pageSize=10`);
      const workouts = data?.workouts ?? [];
      for (const w of workouts) {
        const start = w.start_time ? new Date(w.start_time) : null;
        const end = w.end_time ? new Date(w.end_time) : null;
        if (!start || isNaN(start.getTime())) continue;
        const durationMinutes =
          end && !isNaN(end.getTime())
            ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000))
            : 0;
        const s = summarizeWorkout(w.exercises ?? [], durationMinutes, bw);
        rows.push({
          user_id: userId,
          hevy_id: String(w.id),
          title: (w.title ?? "Workout").slice(0, 120),
          start_time: start.toISOString(),
          end_time: end && !isNaN(end.getTime()) ? end.toISOString() : null,
          duration_minutes: durationMinutes,
          total_volume_kg: s.totalVolumeKg,
          total_reps: s.totalReps,
          total_sets: s.totalSets,
          calories_estimate: s.calories,
          exercises: (w.exercises ?? []).map((e: any) => ({
            title: e.title,
            sets: (e.sets ?? []).map((x: any) => ({
              weight_kg: x.weight_kg ?? null,
              reps: x.reps ?? null,
              duration_seconds: x.duration_seconds ?? null,
              distance_meters: x.distance_meters ?? null,
            })),
          })),
        });
      }
      const pageCount = Number(data?.page_count ?? 1);
      if (!workouts.length || page >= pageCount) break;
    }

    if (rows.length) {
      const { error } = await admin
        .from("hevy_workouts")
        .upsert(rows, { onConflict: "user_id,hevy_id" });
      if (error) return json({ error: error.message }, 500);
    }
    await admin
      .from("hevy_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId);

    return json({ synced: rows.length });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
