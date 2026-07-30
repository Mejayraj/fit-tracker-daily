// MET-based calorie calculations with weighted-rep adjustment
export const EXERCISE_TYPES = [
  { value: "strength", label: "Strength", met: 5 },
  { value: "cardio", label: "Cardio", met: 8 },
  { value: "running", label: "Running", met: 9.8 },
  { value: "cycling", label: "Cycling", met: 7.5 },
  { value: "yoga", label: "Yoga", met: 3 },
  { value: "hiit", label: "HIIT", met: 10 },
  { value: "walking", label: "Walking", met: 3.5 },
  { value: "swimming", label: "Swimming", met: 8 },
  { value: "other", label: "Other", met: 5 },
] as const;

export const DEFAULT_BODY_WEIGHT_KG = 70;

/** kcal per (kg lifted x rep): 0.5 m displacement, 9.81 m/s², 22% efficiency. */
export const KCAL_PER_KG_REP = (0.5 * 9.81) / 4184 / 0.22;
const BODYWEIGHT_LOAD_FACTOR = 0.35;

/**
 * Estimate calories for a whole strength session from real training data
 * (session duration + total volume). Used for Hevy-synced workouts.
 */
export function estimateCaloriesFromVolume({
  durationMinutes,
  volumeKg,
  reps,
  bodyWeightKg = DEFAULT_BODY_WEIGHT_KG,
}: {
  durationMinutes: number;
  volumeKg: number;
  reps: number;
  bodyWeightKg?: number | null;
}) {
  const bw = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;
  const metabolic = (5 * 3.5 * bw) / 200 * Math.max(0, durationMinutes);
  const loaded = volumeKg > 0 ? volumeKg : reps * bw * BODYWEIGHT_LOAD_FACTOR;
  return Math.max(0, Math.round(metabolic + loaded * KCAL_PER_KG_REP));
}

/**
 * Estimate calories burned.
 * - Cardio / time-based: MET formula → kcal = MET * 3.5 * bodyWeight / 200 * minutes
 * - Strength (sets/reps/weight): time portion via MET (~3s/rep + 60s rest/set)
 *   plus mechanical work bonus from weight lifted: ≈ 0.0035 kcal per kg lifted per rep
 *   (work = sets*reps*weight*displacement, with ~0.5m and ~25% efficiency).
 */
export function estimateCaloriesBurned({
  type,
  durationMinutes,
  sets,
  reps,
  weight,
  bodyWeightKg = DEFAULT_BODY_WEIGHT_KG,
}: {
  type: string;
  durationMinutes?: number | null;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  bodyWeightKg?: number | null;
}) {
  const meta = EXERCISE_TYPES.find((t) => t.value === type) ?? EXERCISE_TYPES[0];
  const bw = bodyWeightKg && bodyWeightKg > 0 ? bodyWeightKg : DEFAULT_BODY_WEIGHT_KG;

  if (durationMinutes && durationMinutes > 0) {
    return Math.round((meta.met * 3.5 * bw) / 200 * durationMinutes);
  }
  if (sets && reps) {
    const minutes = (sets * (reps * 3 + 60)) / 60;
    const baseKcal = (meta.met * 3.5 * bw) / 200 * minutes;
    const liftBonus = weight && weight > 0 ? sets * reps * weight * 0.0035 : 0;
    return Math.max(1, Math.round(baseKcal + liftBonus));
  }
  return 0;
}