import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell, Trash2, Plus, Flame, ClipboardList, Search, Save, X, Check, Bike, Footprints, Waves, Mountain, Activity } from "lucide-react";
import { EXERCISE_TYPES, estimateCaloriesBurned } from "@/lib/calories";
import StravaActivities from "@/components/StravaActivities";
import HevyWorkouts from "@/components/HevyWorkouts";
import { useHevy } from "@/hooks/useHevy";

type Workout = {
  id: string; exercise_type: string; exercise_name: string;
  sets: number | null; reps: number | null; weight: number | null;
  duration_minutes: number | null; calories_burned: number; logged_at: string;
};

type RoutineExercise = {
  exercise_type: string;
  exercise_name: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration_minutes?: number | null;
};

type Routine = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
};

const CARDIO_TYPES = ["cardio", "running", "cycling", "yoga", "hiit", "walking", "swimming"];

type StravaActivity = {
  id: number;
  name: string;
  sport_type: string;
  start_date: string;
  duration_minutes: number;
  calories: number | null;
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

export default function Workouts() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [list, setList] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [bodyWeight, setBodyWeight] = useState<number | null>(null);
  const [stravaToday, setStravaToday] = useState<StravaActivity[]>([]);
  const { status: hevyStatus, workouts: hevyWorkouts, syncing: hevySyncing, sync: hevySync } = useHevy(user?.id);

  // log form
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [sets, setSets] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const [showLog, setShowLog] = useState(false);

  // routine builder / runner
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [doneIdx, setDoneIdx] = useState<Record<number, boolean>>({});

  const isCardio = CARDIO_TYPES.includes(type);

  const loadDay = async () => {
    if (!user) return;
    const { data, error } = await supabase.from("workouts").select("*")
      .eq("user_id", user.id).eq("logged_at", date)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setList((data ?? []) as Workout[]);
  };

  const loadRoutines = async () => {
    if (!user) return;
    const { data } = await supabase.from("workout_routines").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setRoutines((data ?? []).map((r: any) => ({ id: r.id, name: r.name, exercises: r.exercises ?? [] })));
  };

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("body_weight_kg").eq("id", user.id).maybeSingle();
    setBodyWeight(data?.body_weight_kg ? Number(data.body_weight_kg) : null);
  };

  useEffect(() => { loadDay(); }, [user, date]);
  useEffect(() => { loadRoutines(); loadProfile(); }, [user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.functions.invoke("strava-activities");
      if (cancelled || error || !data?.connected) { setStravaToday([]); return; }
      const acts: StravaActivity[] = data.activities ?? [];
      setStravaToday(acts.filter((a) => format(new Date(a.start_date), "yyyy-MM-dd") === date));
    })();
    return () => { cancelled = true; };
  }, [user, date]);

  const submit = async (e?: React.FormEvent, override?: Partial<RoutineExercise> & { name?: string }) => {
    e?.preventDefault();
    if (!user) return;
    const ex = {
      type: override?.exercise_type ?? type,
      name: (override?.exercise_name ?? name).trim(),
      sets: (override?.sets ?? (sets === "" ? null : Number(sets))) ?? null,
      reps: (override?.reps ?? (reps === "" ? null : Number(reps))) ?? null,
      weight: (override?.weight ?? (weight === "" ? null : Number(weight))) ?? null,
      duration: (override?.duration_minutes ?? (duration === "" ? null : Number(duration))) ?? null,
    };
    if (!ex.name) return toast.error("Enter exercise name");
    const cal = estimateCaloriesBurned({
      type: ex.type, durationMinutes: ex.duration, sets: ex.sets, reps: ex.reps, weight: ex.weight,
      bodyWeightKg: bodyWeight ?? undefined,
    });
    setBusy(true);
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id, exercise_type: ex.type, exercise_name: ex.name.slice(0, 80),
      sets: ex.sets, reps: ex.reps, weight: ex.weight, duration_minutes: ex.duration,
      calories_burned: cal, logged_at: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${ex.name} · ${cal} kcal`);
    if (!override) {
      setName(""); setSets(""); setReps(""); setWeight(""); setDuration("");
      setShowLog(false);
    }
    loadDay();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setList((l) => l.filter((x) => x.id !== id));
  };

  const saveBodyWeight = async (v: number) => {
    if (!user) return;
    setBodyWeight(v);
    await supabase.from("profiles").update({ body_weight_kg: v }).eq("id", user.id);
  };

  const hevyToday = hevyWorkouts.filter((w) => format(new Date(w.start_time), "yyyy-MM-dd") === date);
  const stravaBurn = stravaToday.reduce((s, a) => s + (a.calories ?? 0), 0);
  const hevyBurn = hevyToday.reduce((s, w) => s + w.calories_estimate, 0);
  const totalBurn = list.reduce((s, w) => s + w.calories_burned, 0) + stravaBurn + hevyBurn;

  // Save current day's workouts as a routine
  const saveTodayAsRoutine = async () => {
    if (!user || list.length === 0) return toast.error("Log workouts first");
    const rname = window.prompt("Routine name", `Routine ${format(new Date(), "MMM d")}`);
    if (!rname) return;
    const exercises: RoutineExercise[] = list.map((w) => ({
      exercise_type: w.exercise_type, exercise_name: w.exercise_name,
      sets: w.sets, reps: w.reps, weight: w.weight, duration_minutes: w.duration_minutes,
    }));
    const { error } = await supabase.from("workout_routines").insert({
      user_id: user.id, name: rname.slice(0, 80), exercises: exercises as any,
    });
    if (error) return toast.error(error.message);
    toast.success("Routine saved");
    loadRoutines();
  };

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase.from("workout_routines").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setRoutines((r) => r.filter((x) => x.id !== id));
  };

  const startRoutine = (r: Routine) => {
    setActiveRoutine(r);
    setDoneIdx({});
  };

  const logRoutineExercise = async (i: number, ex: RoutineExercise) => {
    await submit(undefined, ex);
    setDoneIdx((d) => ({ ...d, [i]: true }));
  };

  return (
    <div className="space-y-5 pb-4">
      {/* Header — Hevy style */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight leading-tight">Workout Log</h2>
          <p className="text-sm text-muted-foreground">{format(new Date(date), "EEEE, MMM d")}</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>

      <button
        type="button"
        aria-label="Log a new workout"
        onClick={() => setShowLog(true)}
        className="fixed z-50 right-5 bottom-[104px] h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_28px_hsl(var(--primary)/0.45)] active:scale-95 transition"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Quick start */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Quick Start</h2>
        <Dialog open={showLog} onOpenChange={setShowLog}>
          <DialogTrigger asChild>
            <button className="w-full rounded-xl bg-secondary/60 hover:bg-secondary px-4 py-4 flex items-center gap-3 text-left transition">
              <Plus className="h-5 w-5 text-primary" />
              <span className="font-medium">Log Exercise</span>
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log exercise</DialogTitle></DialogHeader>
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
              <div>
                <Label htmlFor="bw" className="text-xs">Your body weight (kg) — improves calorie estimate</Label>
                <Input id="bw" type="number" min={20} max={300} step="0.1" value={bodyWeight ?? ""} onChange={(e) => saveBodyWeight(Number(e.target.value))} placeholder="70" />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Log
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      {/* Routines */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Routines</h2>
          <Button size="sm" variant="ghost" onClick={saveTodayAsRoutine}>
            <Save className="h-4 w-4 mr-1" /> Save today
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowBuilder(true)}
            className="rounded-xl bg-secondary/60 hover:bg-secondary p-4 flex flex-col items-center justify-center gap-2 aspect-[1.4]"
          >
            <ClipboardList className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">New Routine</span>
          </button>
          <div className="rounded-xl bg-secondary/60 p-4 flex flex-col items-center justify-center gap-2 aspect-[1.4]">
            <Search className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{routines.length} saved</span>
          </div>
        </div>

        {routines.length > 0 && (
          <div className="space-y-2 pt-1">
            {routines.map((r) => (
              <div key={r.id} className="rounded-xl bg-secondary/40 border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.exercises.length} exercises</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" onClick={() => startRoutine(r)}>Start</Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteRoutine(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's logged workouts */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Today</h2>
          <span className="text-accent font-semibold flex items-center gap-1 text-sm"><Flame className="h-4 w-4" /> {totalBurn} kcal</span>
        </div>
        <div className="space-y-2">
          {list.length === 0 && stravaToday.length === 0 && hevyToday.length === 0 && (
            <div className="rounded-xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No workouts logged yet.
            </div>
          )}
          {hevyToday.map((w) => (
            <div key={`hevy-${w.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{w.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {w.duration_minutes} min · {w.total_sets}×sets · {Math.round(w.total_volume_kg).toLocaleString()} kg · Hevy
                  </div>
                </div>
              </div>
              <span className="text-accent font-semibold text-sm shrink-0">-{w.calories_estimate}</span>
            </div>
          ))}
          {stravaToday.map((a) => {
            const Icon = sportIcon(a.sport_type);
            return (
              <div key={`strava-${a.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-[hsl(16,100%,50%)]/15 text-[hsl(16,100%,50%)] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground capitalize truncate">
                      {a.duration_minutes} min · {a.sport_type} · Strava
                    </div>
                  </div>
                </div>
                {a.calories != null && (
                  <span className="text-accent font-semibold text-sm shrink-0">-{a.calories}</span>
                )}
              </div>
            );
          })}
          {list.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-2 rounded-xl bg-secondary/60 px-3 py-3">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{w.exercise_name}</div>
                <div className="text-xs text-muted-foreground capitalize truncate">
                  {w.duration_minutes ? `${w.duration_minutes} min` : `${w.sets ?? 0}×${w.reps ?? 0}${w.weight ? ` · ${w.weight}kg` : ""}`} · {w.exercise_type}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-accent font-semibold text-sm">-{w.calories_burned}</span>
                <Button size="icon" variant="ghost" onClick={() => remove(w.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hevy workouts */}
      <HevyWorkouts
        workouts={hevyWorkouts}
        excludeDate={date}
        connected={!!hevyStatus?.connected}
        syncing={hevySyncing}
        onSync={() => { hevySync().catch((e) => toast.error(e instanceof Error ? e.message : "Sync failed")); }}
      />

      {/* Strava activities */}
      <StravaActivities excludeDate={date} />

      {/* Routine builder */}
      <RoutineBuilder
        open={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSaved={() => { setShowBuilder(false); loadRoutines(); }}
        userId={user?.id}
      />

      {/* Routine runner — checklist */}
      <Dialog open={!!activeRoutine} onOpenChange={(o) => !o && setActiveRoutine(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Dumbbell className="h-5 w-5 text-primary" /> {activeRoutine?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {activeRoutine?.exercises.map((ex, i) => {
              const done = !!doneIdx[i];
              return (
                <div key={i} className={`rounded-lg p-3 border transition ${done ? "bg-primary/10 border-primary/40" : "bg-secondary/40 border-border/60"}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={done} onCheckedChange={() => !done && logRoutineExercise(i, ex)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{ex.exercise_name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {ex.duration_minutes ? `${ex.duration_minutes} min` : `${ex.sets ?? 0}×${ex.reps ?? 0}${ex.weight ? ` · ${ex.weight}kg` : ""}`} · {ex.exercise_type}
                      </div>
                    </div>
                    {done && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveRoutine(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoutineBuilder({ open, onClose, onSaved, userId }: { open: boolean; onClose: () => void; onSaved: () => void; userId?: string }) {
  const [rname, setRname] = useState("");
  const [items, setItems] = useState<RoutineExercise[]>([]);
  const [type, setType] = useState("strength");
  const [name, setName] = useState("");
  const [sets, setSets] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const isCardio = CARDIO_TYPES.includes(type);

  const add = () => {
    if (!name.trim()) return toast.error("Enter exercise name");
    setItems((it) => [...it, {
      exercise_type: type, exercise_name: name.trim(),
      sets: sets === "" ? null : Number(sets),
      reps: reps === "" ? null : Number(reps),
      weight: weight === "" ? null : Number(weight),
      duration_minutes: duration === "" ? null : Number(duration),
    }]);
    setName(""); setSets(""); setReps(""); setWeight(""); setDuration("");
  };

  const save = async () => {
    if (!userId) return;
    if (!rname.trim()) return toast.error("Routine name required");
    if (items.length === 0) return toast.error("Add at least one exercise");
    const { error } = await supabase.from("workout_routines").insert({
      user_id: userId, name: rname.trim().slice(0, 80), exercises: items as any,
    });
    if (error) return toast.error(error.message);
    toast.success("Routine saved");
    setRname(""); setItems([]);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>New Routine</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Routine name (e.g. Push Day)" value={rname} onChange={(e) => setRname(e.target.value)} maxLength={80} />

          <div className="space-y-2 rounded-md border border-border/60 p-3">
            <div className="grid grid-cols-2 gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXERCISE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Exercise" maxLength={80} />
            </div>
            {isCardio ? (
              <Input type="number" placeholder="Duration (min)" min={1} max={600} value={duration} onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} />
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Sets" min={1} max={50} value={sets} onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))} />
                <Input type="number" placeholder="Reps" min={1} max={200} value={reps} onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))} />
                <Input type="number" placeholder="kg" min={0} max={1000} step="0.5" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            )}
            <Button size="sm" variant="secondary" onClick={add} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Add exercise
            </Button>
          </div>

          {items.length > 0 && (
            <div className="space-y-1.5 max-h-56 overflow-auto">
              {items.map((it, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-secondary/50 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.exercise_name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {it.duration_minutes ? `${it.duration_minutes} min` : `${it.sets ?? 0}×${it.reps ?? 0}${it.weight ? ` · ${it.weight}kg` : ""}`} · {it.exercise_type}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setItems((a) => a.filter((_, j) => j !== i))}>
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Save routine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
