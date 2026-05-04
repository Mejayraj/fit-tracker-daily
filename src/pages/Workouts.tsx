import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Dumbbell, Trash2, Plus, Flame } from "lucide-react";
import { EXERCISE_TYPES, estimateCaloriesBurned } from "@/lib/calories";

type Workout = {
  id: string; exercise_type: string; exercise_name: string;
  sets: number | null; reps: number | null; weight: number | null;
  duration_minutes: number | null; calories_burned: number; logged_at: string;
};

export default function Workouts() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [list, setList] = useState<Workout[]>([]);
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [sets, setSets] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("workouts").select("*")
      .eq("user_id", user.id).eq("logged_at", date)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as Workout[]);
  };
  useEffect(() => { load(); }, [user, date]);

  const isCardio = ["cardio", "running", "cycling", "yoga", "hiit", "walking", "swimming"].includes(type);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) return toast.error("Enter exercise name");
    const cal = estimateCaloriesBurned({
      type,
      durationMinutes: duration === "" ? null : Number(duration),
      sets: sets === "" ? null : Number(sets),
      reps: reps === "" ? null : Number(reps),
      weight: weight === "" ? null : Number(weight),
    });
    setBusy(true);
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id,
      exercise_type: type,
      exercise_name: name.trim().slice(0, 80),
      sets: sets === "" ? null : Number(sets),
      reps: reps === "" ? null : Number(reps),
      weight: weight === "" ? null : Number(weight),
      duration_minutes: duration === "" ? null : Number(duration),
      calories_burned: cal,
      logged_at: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${name} · ${cal} kcal`);
    setName(""); setSets(""); setReps(""); setWeight(""); setDuration("");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList((l) => l.filter((x) => x.id !== id));
  };

  const totalBurn = list.reduce((s, w) => s + w.calories_burned, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout Log</h1>
          <p className="text-sm text-muted-foreground">Track strength, cardio, yoga and more.</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Dumbbell className="h-5 w-5 text-accent" /> New workout</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="en">Exercise</Label>
                <Input id="en" value={name} onChange={(e) => setName(e.target.value)} placeholder="Bench Press" maxLength={80} />
              </div>
            </div>

            {isCardio ? (
              <div>
                <Label htmlFor="dur">Duration (minutes)</Label>
                <Input id="dur" type="number" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <div><Label htmlFor="s">Sets</Label><Input id="s" type="number" min={1} max={50} value={sets} onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))} /></div>
                <div><Label htmlFor="r">Reps</Label><Input id="r" type="number" min={1} max={200} value={reps} onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))} /></div>
                <div><Label htmlFor="w">Weight (kg)</Label><Input id="w" type="number" min={0} max={1000} step="0.5" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground shadow-glow-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-1" /> Log workout
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Today</CardTitle>
          <span className="text-accent font-semibold flex items-center gap-1"><Flame className="h-4 w-4" /> {totalBurn} kcal</span>
        </CardHeader>
        <CardContent className="space-y-2">
          {list.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No workouts logged.</p>}
          {list.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/60 px-3 py-2.5">
              <div>
                <div className="font-medium text-sm">{w.exercise_name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {w.duration_minutes ? `${w.duration_minutes} min` : `${w.sets ?? 0}×${w.reps ?? 0}${w.weight ? ` · ${w.weight}kg` : ""}`} · {w.exercise_type}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-accent font-semibold text-sm">-{w.calories_burned}</span>
                <Button size="icon" variant="ghost" onClick={() => remove(w.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}