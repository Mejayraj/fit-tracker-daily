import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Bike, Footprints, Dumbbell, Waves, Mountain, Activity, Flame, Clock, RefreshCw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  duration_minutes: number;
  calories: number | null;
  distance_km: number | null;
};

const sportIcon = (sport: string) => {
  const s = sport.toLowerCase();
  if (s.includes("ride") || s.includes("cycl")) return Bike;
  if (s.includes("run") || s.includes("walk")) return Footprints;
  if (s.includes("swim")) return Waves;
  if (s.includes("hike") || s.includes("climb")) return Mountain;
  if (s.includes("weight") || s.includes("workout") || s.includes("crossfit")) return Dumbbell;
  return Activity;
};

export default function StravaActivities({ excludeDate }: { excludeDate?: string } = {}) {
  const [activities, setActivities] = useState<StravaActivity[] | null>(null);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("strava-activities");
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setConnected(data?.connected ?? false);
    setActivities(data?.activities ?? []);
  };

  useEffect(() => { load(); }, []);

  const visible = (activities ?? []).filter((a) => {
    if (!excludeDate) return true;
    return format(parseISO(a.start_date), "yyyy-MM-dd") !== excludeDate;
  });

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-[hsl(16,100%,50%)]" /> Strava Activities
        </h2>
        <Button size="icon" variant="ghost" onClick={load} disabled={loading} aria-label="Refresh">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {!connected && (
        <div className="rounded-xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <Link2 className="h-5 w-5 mx-auto mb-2 opacity-70" />
          Connect your Strava account from the profile menu to see your activities here.
        </div>
      )}

      {connected && error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {connected && !error && activities && visible.length === 0 && !loading && (
        <div className="rounded-xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {excludeDate
            ? "No older Strava activities to show."
            : "No Strava activities yet. Once you record a workout on Strava, it will show up here."}
        </div>
      )}

      {connected && visible.length > 0 && (
        <div className="grid gap-2">
          {visible.map((a) => {
            const Icon = sportIcon(a.sport_type);
            return (
              <div key={a.id} className="rounded-xl bg-secondary/60 px-3 py-3 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[hsl(16,100%,50%)]/15 text-[hsl(16,100%,50%)] flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {format(parseISO(a.start_date), "MMM d, yyyy · p")} · {a.sport_type}
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <div className="text-xs flex items-center gap-1 justify-end text-muted-foreground">
                    <Clock className="h-3 w-3" /> {a.duration_minutes} min
                  </div>
                  {a.calories != null && (
                    <div className="text-xs flex items-center gap-1 justify-end text-accent font-semibold">
                      <Flame className="h-3 w-3" /> {a.calories} kcal
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && !activities && (
        <div className="rounded-xl bg-secondary/30 p-6 text-center text-sm text-muted-foreground">Loading activities...</div>
      )}
    </section>
  );
}