import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Dumbbell, Search, Loader2, Plus } from "lucide-react";
import { estimateCaloriesBurned } from "@/lib/calories";

type Muscle = { id: number; name: string; name_en: string };
type WgerExercise = {
  id: number;
  name: string;
  category: string;
  muscles: Muscle[];
  muscles_secondary: Muscle[];
};

const muscleLabel = (m: Muscle) => (m.name_en && m.name_en.trim()) || m.name;

export default function Exercises() {
  const { user } = useAuth();
  const [items, setItems] = useState<WgerExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string>("all");
  const [selected, setSelected] = useState<WgerExercise | null>(null);
  const [bodyWeight, setBodyWeight] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          "https://wger.de/api/v2/exerciseinfo/?language=2&limit=150&format=json",
        );
        if (!res.ok) throw new Error(`wger ${res.status}`);
        const json = await res.json();
        const mapped: WgerExercise[] = (json.results ?? [])
          .map((r: any) => {
            const tr = (r.translations ?? []).find((t: any) => t.language === 2)
              ?? r.translations?.[0];
            return {
              id: r.id,
              name: tr?.name ?? "",
              category: r.category?.name ?? "Other",
              muscles: r.muscles ?? [],
              muscles_secondary: r.muscles_secondary ?? [],
            };
          })
          .filter((e: WgerExercise) => e.name);
        if (!cancelled) setItems(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? "Failed to load exercises");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("body_weight_kg").eq("id", user.id).maybeSingle()
      .then(({ data }) => setBodyWeight(data?.body_weight_kg ? Number(data.body_weight_kg) : null));
  }, [user]);

  const muscleOptions = useMemo(() => {
    const set = new Map<string, string>();
    items.forEach((e) => [...e.muscles, ...e.muscles_secondary].forEach((m) => {
      const label = muscleLabel(m);
      if (label) set.set(label.toLowerCase(), label);
    }));
    return Array.from(set.values()).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      if (q && !e.name.toLowerCase().includes(q)) return false;
      if (muscle !== "all") {
        const all = [...e.muscles, ...e.muscles_secondary].map(muscleLabel);
        if (!all.includes(muscle)) return false;
      }
      return true;
    });
  }, [items, query, muscle]);

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercise Library</h1>
        <p className="text-sm text-muted-foreground">Browse exercises and log them to your workout log.</p>
      </div>

      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search exercises..."
            className="pl-9"
          />
        </div>
        <Select value={muscle} onValueChange={setMuscle}>
          <SelectTrigger className="sm:w-56"><SelectValue placeholder="All muscles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {muscleOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading exercises…
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="rounded-xl bg-secondary/30 border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No exercises match your filters.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelected(ex)}
            className="text-left rounded-xl bg-secondary/60 hover:bg-secondary border border-border/60 p-4 transition"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/15 p-2"><Dumbbell className="h-4 w-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold truncate">{ex.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{ex.category}</div>
                {ex.muscles.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ex.muscles.slice(0, 3).map((m) => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {muscleLabel(m)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <LogExerciseDialog
        exercise={selected}
        onClose={() => setSelected(null)}
        bodyWeight={bodyWeight}
        userId={user?.id}
      />
    </div>
  );
}

function LogExerciseDialog({
  exercise, onClose, bodyWeight, userId,
}: {
  exercise: WgerExercise | null;
  onClose: () => void;
  bodyWeight: number | null;
  userId?: string;
}) {
  const [sets, setSets] = useState<number | "">(3);
  const [reps, setReps] = useState<number | "">(10);
  const [weight, setWeight] = useState<number | "">("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (exercise) {
      setSets(3); setReps(10); setWeight("");
      setDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [exercise]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exercise || !userId) return;
    const s = sets === "" ? null : Number(sets);
    const r = reps === "" ? null : Number(reps);
    const w = weight === "" ? null : Number(weight);
    if (!s || !r) return toast.error("Enter sets and reps");
    const cal = estimateCaloriesBurned({
      type: "strength", sets: s, reps: r, weight: w, bodyWeightKg: bodyWeight ?? undefined,
    });
    setBusy(true);
    const { error } = await supabase.from("workouts").insert({
      user_id: userId,
      exercise_type: "strength",
      exercise_name: exercise.name.slice(0, 80),
      sets: s, reps: r, weight: w,
      duration_minutes: null,
      calories_burned: cal,
      logged_at: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${exercise.name} · ${cal} kcal`);
    onClose();
  };

  return (
    <Dialog open={!!exercise} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> {exercise?.name}
          </DialogTitle>
        </DialogHeader>
        {exercise && (
          <form onSubmit={submit} className="space-y-4">
            <div className="text-xs text-muted-foreground">
              {exercise.category}
              {exercise.muscles.length > 0 && ` · ${exercise.muscles.map(muscleLabel).join(", ")}`}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="ex-sets">Sets</Label>
                <Input id="ex-sets" type="number" min={1} max={50}
                  value={sets} onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="ex-reps">Reps</Label>
                <Input id="ex-reps" type="number" min={1} max={200}
                  value={reps} onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
              <div>
                <Label htmlFor="ex-weight">Weight (kg)</Label>
                <Input id="ex-weight" type="number" min={0} max={1000} step="0.5"
                  value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} />
              </div>
            </div>
            <div>
              <Label htmlFor="ex-date">Date</Label>
              <Input id="ex-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Log to workout
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}