export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const HEVY_BASE = "https://api.hevyapp.com";
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

export async function hevyFetch(apiKey: string, path: string) {
  const res = await fetch(`${HEVY_BASE}${path}`, {
    headers: { "api-key": apiKey, accept: "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`Hevy request failed [${res.status}] ${path}: ${text}`);
    throw new Error(`[${res.status}] ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON from Hevy API");
  }
}

// ---- Calorie estimation from real training volume ----
const STRENGTH_MET = 5.0;
const CARDIO_MET = 7.0;
const LIFT_DISPLACEMENT_M = 0.5;
const EFFICIENCY = 0.22;
export const KCAL_PER_KG_REP = (LIFT_DISPLACEMENT_M * 9.81) / 4184 / EFFICIENCY;
const BODYWEIGHT_LOAD_FACTOR = 0.35;

export type HevySet = {
  weight_kg?: number | null;
  reps?: number | null;
  duration_seconds?: number | null;
  distance_meters?: number | null;
};
export type HevyExercise = { title?: string; sets?: HevySet[] };

export function summarizeWorkout(
  exercises: HevyExercise[],
  durationMinutes: number,
  bodyWeightKg: number,
) {
  let volumeKg = 0;
  let effectiveKgReps = 0;
  let totalReps = 0;
  let totalSets = 0;
  let cardioSeconds = 0;

  for (const ex of exercises ?? []) {
    for (const s of ex.sets ?? []) {
      totalSets += 1;
      const reps = Number(s.reps ?? 0) || 0;
      const w = Number(s.weight_kg ?? 0) || 0;
      totalReps += reps;
      volumeKg += w * reps;
      if (reps > 0) {
        effectiveKgReps += reps * (w > 0 ? w : bodyWeightKg * BODYWEIGHT_LOAD_FACTOR);
      }
      if (!reps && (s.duration_seconds || s.distance_meters)) {
        cardioSeconds += Number(s.duration_seconds ?? 0) || 0;
      }
    }
  }

  const cardioMin = Math.min(durationMinutes, cardioSeconds / 60);
  const strengthMin = Math.max(0, durationMinutes - cardioMin);
  const metabolic =
    ((STRENGTH_MET * 3.5 * bodyWeightKg) / 200) * strengthMin +
    ((CARDIO_MET * 3.5 * bodyWeightKg) / 200) * cardioMin;
  const work = effectiveKgReps * KCAL_PER_KG_REP;

  return {
    totalVolumeKg: Math.round(volumeKg * 10) / 10,
    totalReps,
    totalSets,
    calories: Math.max(0, Math.round(metabolic + work)),
  };
}
