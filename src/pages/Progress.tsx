import { useEffect, useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trash2, Plus, Scale } from "lucide-react";

export default function ProgressPage() {
  const { user } = useAuth();
  const [foods, setFoods] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [w, setW] = useState<number | "">("");

  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => format(subDays(new Date(), 6 - i), "yyyy-MM-dd")), []);

  const load = async () => {
    if (!user) return;
    const since = days[0];
    const [f, wo, wt] = await Promise.all([
      supabase.from("food_logs").select("logged_at,calories,protein").eq("user_id", user.id).gte("logged_at", since),
      supabase.from("workouts").select("logged_at,calories_burned").eq("user_id", user.id).gte("logged_at", since),
      supabase.from("weight_logs").select("*").eq("user_id", user.id).order("logged_at", { ascending: true }).limit(60),
    ]);
    setFoods(f.data ?? []);
    setWorkouts(wo.data ?? []);
    setWeights(wt.data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const data = days.map((d) => {
    const eaten = foods.filter((x) => x.logged_at === d).reduce((s, x) => s + (x.calories || 0), 0);
    const burned = workouts.filter((x) => x.logged_at === d).reduce((s, x) => s + (x.calories_burned || 0), 0);
    const protein = foods.filter((x) => x.logged_at === d).reduce((s, x) => s + Number(x.protein || 0), 0);
    return { day: format(new Date(d), "EEE"), date: d, net: eaten - burned, protein: Math.round(protein), eaten, burned };
  });

  const logWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || w === "" || Number(w) <= 0 || Number(w) > 500) return toast.error("Enter weight 1-500kg");
    const today = format(new Date(), "yyyy-MM-dd");
    const { error } = await supabase.from("weight_logs").upsert(
      { user_id: user.id, weight_kg: Number(w), logged_at: today },
      { onConflict: "user_id,logged_at" } as any,
    );
    if (error) return toast.error(error.message);
    toast.success("Weight saved");
    setW("");
    load();
  };

  const removeWeight = async (id: string) => {
    const { error } = await supabase.from("weight_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setWeights((l) => l.filter((x) => x.id !== id));
  };

  const weightChart = weights.map((x) => ({ day: format(new Date(x.logged_at), "MMM d"), kg: Number(x.weight_kg) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">Last 7 days at a glance.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Net calories</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? "hsl(var(--primary))" : "hsl(var(--accent))"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg">Protein intake (g)</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="protein" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> Weight</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={logWeight} className="flex gap-2 items-end">
            <div className="flex-1">
              <Label htmlFor="wt">Today's weight (kg)</Label>
              <Input id="wt" type="number" min={1} max={500} step="0.1" value={w} onChange={(e) => setW(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <Button type="submit" className="bg-gradient-primary text-primary-foreground shadow-glow-primary"><Plus className="h-4 w-4 mr-1" />Save</Button>
          </form>

          {weightChart.length > 1 && (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="space-y-1 max-h-56 overflow-auto">
            {weights.slice().reverse().map((x) => (
              <div key={x.id} className="flex items-center justify-between text-sm rounded-md px-3 py-2 hover:bg-secondary">
                <span>{format(new Date(x.logged_at), "EEE, MMM d")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{Number(x.weight_kg).toFixed(1)} kg</span>
                  <Button size="icon" variant="ghost" onClick={() => removeWeight(x.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {weights.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No weight logs yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}