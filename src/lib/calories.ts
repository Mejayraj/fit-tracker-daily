// Approximate MET-based calorie calculations
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

const DEFAULT_BODY_WEIGHT_KG = 70;

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
  bodyWeightKg?: number;
}) {
  const meta = EXERCISE_TYPES.find((t) => t.value === type) ?? EXERCISE_TYPES[0];
  if (durationMinutes && durationMinutes > 0) {
    return Math.round((meta.met * 3.5 * bodyWeightKg) / 200 * durationMinutes);
  }
  if (sets && reps) {
    // assume ~3 seconds per rep + 60s rest per set
    const minutes = (sets * (reps * 3 + 60)) / 60;
    return Math.round((meta.met * 3.5 * bodyWeightKg) / 200 * minutes);
  }
  return 0;
}