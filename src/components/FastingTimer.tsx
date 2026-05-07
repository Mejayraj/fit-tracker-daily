import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Timer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceStrict } from "date-fns";

type Fast = { id: string; start_at: string; end_at: string | null };

const GOAL_HOURS = 16;

function fmtElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FastingTimer() {
  const { user } = useAuth();
  const [active, setActive] = useState<Fast | null>(null);
  const [history, setHistory] = useState<Fast[]>([]);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("fasting_sessions")
      .select("id,start_at,end_at")
      .eq("user_id", user.id)
      .order("start_at", { ascending: false })
      .limit(20);
    const rows = (data ?? []) as Fast[];
    setActive(rows.find((r) => !r.end_at) ?? null);
    setHistory(rows.filter((r) => r.end_at));
  };

  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("fasting_sessions")
      .insert({ user_id: user.id })
      .select("id,start_at,end_at")
      .single();
    setLoading(false);
    if (error) return toast.error(error.message);
    setActive(data as Fast);
    toast.success("Fast started");
  };

  const stop = async () => {
    if (!active) return;
    setLoading(true);
    const { error } = await supabase
      .from("fasting_sessions")
      .update({ end_at: new Date().toISOString() })
      .eq("id", active.id);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Fast ended");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("fasting_sessions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setHistory((h) => h.filter((x) => x.id !== id));
  };

  const elapsedMs = active ? now - new Date(active.start_at).getTime() : 0;
  const hours = elapsedMs / 3_600_000;
  const pct = Math.min(100, (hours / GOAL_HOURS) * 100);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2"><Timer className="h-4 w-4" /> Fasting Timer</CardTitle>
        {active ? <Badge>Running</Badge> : <Badge variant="secondary">Idle</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center py-2">
          <RingProgress pct={pct} label={fmtElapsed(elapsedMs)} sub={`${hours.toFixed(1)} / ${GOAL_HOURS}h goal`} />
          {active && (
            <p className="text-xs text-muted-foreground mt-2">
              Started {format(new Date(active.start_at), "EEE, MMM d · HH:mm")}
            </p>
          )}
        </div>

        {active ? (
          <Button onClick={stop} disabled={loading} variant="destructive" className="w-full">
            <Square className="h-4 w-4 mr-1" /> End fast
          </Button>
        ) : (
          <Button onClick={start} disabled={loading} className="w-full">
            <Play className="h-4 w-4 mr-1" /> Start fast
          </Button>
        )}

        {history.length > 0 && (
          <div className="space-y-1 pt-2">
            <p className="text-xs text-muted-foreground">Recent fasts</p>
            {history.slice(0, 5).map((f) => {
              const dur = new Date(f.end_at!).getTime() - new Date(f.start_at).getTime();
              return (
                <div key={f.id} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                  <div>
                    <div className="font-medium">{(dur / 3_600_000).toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(f.start_at), "MMM d, HH:mm")} → {format(new Date(f.end_at!), "MMM d, HH:mm")}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RingProgress({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative h-44 w-44">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={r} stroke="hsl(var(--secondary))" strokeWidth="10" fill="none" />
        <circle
          cx="80" cy="80" r={r}
          stroke="hsl(var(--primary))"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold tabular-nums">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </div>
  );
}