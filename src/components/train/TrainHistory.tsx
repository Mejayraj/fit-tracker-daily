import { useRef, useState } from "react";
import { format } from "date-fns";
import { Dumbbell, Flame, Loader2, ArrowDown } from "lucide-react";
import type { HevyWorkout } from "@/hooks/useHevy";
import StravaActivities from "@/components/StravaActivities";

export default function TrainHistory({
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
  const [pull, setPull] = useState(0);
  const startY = useRef<number | null>(null);

  const list = excludeDate
    ? workouts.filter((w) => format(new Date(w.start_time), "yyyy-MM-dd") !== excludeDate)
    : workouts;

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 0) startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const d = e.touches[0].clientY - startY.current;
    setPull(d > 0 ? Math.min(d * 0.5, 80) : 0);
  };
  const onTouchEnd = () => {
    if (pull > 55 && !syncing) onSync();
    setPull(0);
    startY.current = null;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="space-y-4"
    >
      <div
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground overflow-hidden transition-[height] duration-150"
        style={{ height: syncing ? 32 : pull }}
      >
        {syncing ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Syncing from Hevy…</>
        ) : pull > 0 ? (
          <><ArrowDown className={`h-3.5 w-3.5 transition-transform ${pull > 55 ? "rotate-180" : ""}`} />
            {pull > 55 ? "Release to sync" : "Pull to sync"}</>
        ) : null}
      </div>

      {connected ? (
        list.length === 0 ? (
          <div className="rounded-2xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No Hevy workouts synced yet. Pull down to sync.
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((w) => (
              <div key={w.id} className="rounded-2xl bg-secondary/60 px-3 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{w.title}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {format(new Date(w.start_time), "MMM d")} · {w.duration_minutes} min · {w.total_sets} sets ·{" "}
                      {w.total_reps} reps · {Math.round(w.total_volume_kg).toLocaleString()} kg
                    </div>
                  </div>
                </div>
                <span className="text-accent font-semibold text-sm shrink-0 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> {w.calories_estimate}
                </span>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Connect Hevy from the Me tab to see your workout history here.
        </div>
      )}

      <StravaActivities excludeDate={excludeDate} />
    </div>
  );
}