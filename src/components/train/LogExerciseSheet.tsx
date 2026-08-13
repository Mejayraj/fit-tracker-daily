import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { hapticLight } from "@/lib/haptics";
import { Plus, Search } from "lucide-react";
import { EXERCISE_TYPES, estimateCaloriesBurned } from "@/lib/calories";

const CARDIO_TYPES = ["cardio", "running", "cycling", "yoga", "hiit", "walking", "swimming"];

const SUGGESTIONS = [
  "Bench Press", "Incline Dumbbell Press", "Overhead Press", "Lateral Raise",
  "Pull Up", "Lat Pulldown", "Barbell Row", "Deadlift", "Back Squat",
  "Leg Press", "Romanian Deadlift", "Leg Extension", "Hamstring Curl",
  "Barbell Curl", "Hammer Curl", "Triceps Pushdown", "Dips", "Plank",
  "Hanging Leg Raise", "Cable Crunch", "Running", "Cycling", "Rowing Machine",
];

export default function LogExerciseSheet({
  open,
  onOpenChange,
  date,
  onLogged,
  presetName,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  date: string;
  onLogged?: () => void;
  presetName?: string;
}) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("strength");
  const [sets, setSets] = useState<number | "">(3);
  const [reps, setReps] = useState<number | "">(10);
  const [weight, setWeight] = useState<number | "">("");
  const [duration, setDuration] = useState<number | "">("");
  const [bodyWeight, setBodyWeight] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const isCardio = CARDIO_TYPES.includes(type);

  useEffect(() => {
    if (!open) return;
    setQuery(presetName ?? "");
    setName(presetName ?? "");
    setSets(3); setReps(10); setWeight(""); setDuration("");
  }, [open, presetName]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("body_weight_kg").eq("id", user.id).maybeSingle()
      .then(({ data }) => setBodyWeight(data?.body_weight_kg ? Number(data.body_weight_kg) : null));
  }, [user]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q === name.toLowerCase()) return [];
    return SUGGESTIONS.filter((s) => s.toLowerCase().includes(q)).slice(0, 6);
  }, [query, name]);

  const saveBodyWeight = async (v: number) => {
    if (!user) return;
    setBodyWeight(v);
    await supabase.from("profiles").update({ body_weight_kg: v }).eq("id", user.id);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Sign in required");
    const exName = (name || query).trim();
    if (!exName) return toast.error("Enter an exercise name");
    const s = sets === "" ? null : Number(sets);
    const r = reps === "" ? null : Number(reps);
    const w = weight === "" ? null : Number(weight);
    const d = duration === "" ? null : Number(duration);
    const cal = estimateCaloriesBurned({
      type, durationMinutes: d, sets: s, reps: r, weight: w, bodyWeightKg: bodyWeight ?? undefined,
    });
    setBusy(true);
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id, exercise_type: type, exercise_name: exName.slice(0, 80),
      sets: isCardio ? null : s, reps: isCardio ? null : r, weight: isCardio ? null : w,
      duration_minutes: isCardio ? d : null, calories_burned: cal, logged_at: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    hapticLight();
    toast.success(`Logged ${exName} · ${cal} kcal`);
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Add exercise to today</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-4 pb-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search or type an exercise"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setName(e.target.value); }}
              maxLength={80}
            />
          </div>
          {matches.length > 0 && (
            <div className="rounded-xl border border-border/60 divide-y divide-border/60 overflow-hidden">
              {matches.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setName(m); setQuery(m); }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-secondary"
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXERCISE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {isCardio ? (
            <div>
              <Label htmlFor="ls-dur">Duration (minutes)</Label>
              <Input id="ls-dur" type="number" min={1} max={600} value={duration}
                onChange={(e) => setDuration(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div><Label htmlFor="ls-s">Sets</Label><Input id="ls-s" type="number" min={1} max={50} value={sets}
                onChange={(e) => setSets(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div><Label htmlFor="ls-r">Reps</Label><Input id="ls-r" type="number" min={1} max={200} value={reps}
                onChange={(e) => setReps(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div><Label htmlFor="ls-w">kg</Label><Input id="ls-w" type="number" min={0} max={1000} step="0.5" value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} /></div>
            </div>
          )}

          <div>
            <Label htmlFor="ls-bw" className="text-xs">Body weight (kg) — improves calorie estimate</Label>
            <Input id="ls-bw" type="number" min={20} max={300} step="0.1" placeholder="70"
              value={bodyWeight ?? ""} onChange={(e) => saveBodyWeight(Number(e.target.value))} />
          </div>

          <Button type="submit" disabled={busy} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Add to today
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}