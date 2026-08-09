import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHevy } from "@/hooks/useHevy";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Apple, Dumbbell, Flame, Plus, Utensils } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";

type Profile = { display_name: string | null; calorie_goal: number; protein_goal: number; carb_goal: number; fat_goal: number };

export default function Dashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [foods, setFoods] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const today = format(new Date(), "yyyy-MM-dd");
  const { workouts: hevyWorkouts } = useHevy(user?.id);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, f, w] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("food_logs").select("*").eq("user_id", user.id).eq("logged_at", today),
        supabase.from("workouts").select("*").eq("user_id", user.id).eq("logged_at", today),
      ]);
      setProfile(p.data as any);
      setFoods(f.data ?? []);
      setWorkouts(w.data ?? []);
    })();
  }, [user, today]);

  const eaten = foods.reduce((s, f) => s + (f.calories || 0), 0);
  const hevyBurnedToday = hevyWorkouts
    .filter((w) => format(new Date(w.start_time), "yyyy-MM-dd") === today)
    .reduce((s, w) => s + (w.calories_estimate || 0), 0);
  const burned = workouts.reduce((s, w) => s + (w.calories_burned || 0), 0) + hevyBurnedToday;
  const protein = foods.reduce((s, f) => s + Number(f.protein || 0), 0);
  const carbs = foods.reduce((s, f) => s + Number(f.carbs || 0), 0);
  const fat = foods.reduce((s, f) => s + Number(f.fat || 0), 0);
  const goal = profile?.calorie_goal ?? 2200;
  const remaining = goal - eaten + burned;
  const ringPct = Math.max(0, Math.min(1, eaten / goal));

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Hi, {profile?.display_name || "Athlete"} · {format(new Date(), "EEE, MMM d")}
            </p>
          </div>
          <ProfileMenu />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => nav("/train")} className="gap-2 bg-gradient-accent text-accent-foreground shadow-glow-accent hover:opacity-90">
            <Dumbbell className="h-4 w-4" /> Log Workout
          </Button>
          <Button onClick={() => nav("/food")} className="gap-2 bg-gradient-primary text-primary-foreground shadow-glow-primary hover:opacity-90">
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </div>
      </header>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Calorie ring */}
        <Card className="shadow-card">
          <CardContent className="p-6 flex flex-col items-center">
            <CalorieRing pct={ringPct} remaining={remaining} />
            <div className="grid grid-cols-3 gap-6 mt-6 text-center w-full">
              <Stat icon={<Apple className="h-3.5 w-3.5" />} label="EATEN" value={eaten} tone="primary" />
              <Stat icon={<Flame className="h-3.5 w-3.5" />} label="BURNED" value={burned} tone="accent" />
              <Stat icon={<Activity className="h-3.5 w-3.5" />} label="NET" value={eaten - burned} tone={eaten - burned >= 0 ? "primary" : "accent"} />
            </div>
          </CardContent>
        </Card>

        {/* Macros */}
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">Macros</h2>
              <span className="text-xs tracking-widest text-muted-foreground">TODAY</span>
            </div>
            <div className="space-y-5">
              <MacroBar label="PROTEIN" value={protein} goal={profile?.protein_goal ?? 150} color="#39FF14" />
              <MacroBar label="CARBS" value={carbs} goal={profile?.carb_goal ?? 250} color="#EF9F27" />
              <MacroBar label="FATS" value={fat} goal={profile?.fat_goal ?? 70} color="#7F77DD" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's lists */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Meals</h3>
              </div>
              <span className="text-xs text-muted-foreground">{foods.length} logged</span>
            </div>
            {foods.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No meals yet today. Tap Log Meal to search foods.</p>
            ) : (
              <ul className="space-y-2">
                {foods.map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5">
                    <div>
                      <div className="font-medium text-sm">{f.food_name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{f.meal_type} · {f.portion_grams}g</div>
                    </div>
                    <span className="text-primary font-semibold text-sm">{f.calories} kcal</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-bold">Workouts</h3>
              </div>
              <span className="text-xs text-muted-foreground">{workouts.length} logged</span>
            </div>
            {workouts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-10">No workouts yet today. Tap Log Workout.</p>
            ) : (
              <ul className="space-y-2">
                {workouts.map((w) => (
                  <li key={w.id} className="flex items-center justify-between rounded-lg bg-secondary/60 px-3 py-2.5">
                    <div>
                      <div className="font-medium text-sm">{w.exercise_name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {w.duration_minutes ? `${w.duration_minutes} min` : `${w.sets ?? 0}×${w.reps ?? 0}${w.weight ? ` · ${w.weight}kg` : ""}`} · {w.exercise_type}
                      </div>
                    </div>
                    <span className="text-accent font-semibold text-sm">-{w.calories_burned}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalorieRing({ pct, remaining }: { pct: number; remaining: number }) {
  const r = 88;
  const c = 2 * Math.PI * r;
  const [animPct, setAnimPct] = useState(0);
  const raf = useRef<number>();
  useEffect(() => {
    setAnimPct(0);
    raf.current = requestAnimationFrame(() => requestAnimationFrame(() => setAnimPct(pct)));
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [pct]);
  return (
    <div className="relative h-56 w-56">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={r} stroke="hsl(var(--secondary))" strokeWidth="14" fill="none" />
        <circle
          cx="100" cy="100" r={r}
          stroke="hsl(var(--primary))"
          strokeWidth="14" fill="none" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - animPct)}
          style={{
            filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.6))",
            transition: "stroke-dashoffset 900ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-bold text-primary text-glow-primary tabular-nums">{Math.max(0, remaining)}</div>
        <div className="text-xs tracking-widest text-muted-foreground mt-1">KCAL REMAINING</div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "primary" | "accent" }) {
  return (
    <div>
      <div className={`flex items-center justify-center gap-1 text-[10px] tracking-widest ${tone === "primary" ? "text-primary" : "text-accent"}`}>
        {icon}{label}
      </div>
      <div className="text-2xl font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, (value / goal) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs tracking-widest text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-foreground"><span className="font-bold">{Math.round(value)}</span><span> / {goal}g</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, transition: "width 0.5s", background: color, boxShadow: `0 0 12px ${color}80` }}
        />
      </div>
    </div>
  );
}