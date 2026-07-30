import { format } from "date-fns";
import { Dumbbell, Flame, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { HevyWorkout } from "@/hooks/useHevy";

export default function HevyWorkouts({
  workouts,
  excludeDate,
  connected,
  syncing,
  onSync,
}: {
  workouts: HevyWorkout[];
  excludeDate?: string;
  connected: boolean;
  syncing: boolean;
  onSync: () => void;
}) {
  if (!connected) return null;
  const list = excludeDate
    ? workouts.filter((w) => format(new Date(w.start_time), "yyyy-MM-dd") !== excludeDate)
    : workouts;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" /> Hevy workouts
        </h2>
        <Button size="sm" variant="ghost" disabled={syncing} onClick={onSync}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </div>
      {list.length === 0 ? (
        <div className="rounded-xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No Hevy workouts synced yet. Log a session in Hevy, then hit sync.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="rounded-xl bg-secondary/60 px-3 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{w.title}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {format(new Date(w.start_time), "MMM d")} · {w.duration_minutes} min · {w.total_sets} sets ·{" "}
                  {w.total_reps} reps · {Math.round(w.total_volume_kg).toLocaleString()} kg volume
                </div>
              </div>
              <span className="text-accent font-semibold text-sm shrink-0 flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" /> {w.calories_estimate}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
