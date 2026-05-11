import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FOOD_DB, FoodItem, scaleFood, searchFoods } from "@/lib/foods";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import FastingTimer from "@/components/FastingTimer";
import UsdaFoodSearch from "@/components/UsdaFoodSearch";
import BarcodeScanner from "@/components/BarcodeScanner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FoodLog = {
  id: string;
  food_name: string;
  meal_type: string;
  portion_grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
};

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

export default function Food() {
  const { user } = useAuth();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [history, setHistory] = useState<{ logged_at: string; calories: number; count: number }[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [grams, setGrams] = useState(100);
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("breakfast");
  const [customName, setCustomName] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customCals, setCustomCals] = useState<number | "">("");
  const [customProtein, setCustomProtein] = useState<number | "">("");
  const [customCarbs, setCustomCarbs] = useState<number | "">("");
  const [customFat, setCustomFat] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  const results = useMemo(() => searchFoods(query), [query]);

  const loadDay = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("logged_at", date)
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else setLogs((data ?? []) as FoodLog[]);
  };

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("food_logs")
      .select("logged_at,calories")
      .eq("user_id", user.id)
      .order("logged_at", { ascending: false })
      .limit(500);
    const byDay = new Map<string, { calories: number; count: number }>();
    (data ?? []).forEach((r: any) => {
      const cur = byDay.get(r.logged_at) ?? { calories: 0, count: 0 };
      cur.calories += r.calories;
      cur.count += 1;
      byDay.set(r.logged_at, cur);
    });
    setHistory(Array.from(byDay.entries()).map(([logged_at, v]) => ({ logged_at, ...v })).slice(0, 14));
  };

  useEffect(() => {
    loadDay();
  }, [user, date]);

  useEffect(() => {
    loadHistory();
  }, [user, logs.length]);

  const addFood = async () => {
    if (!user) return;
    const name = selected?.name ?? customName.trim();
    if (!name) {
      toast.error("Pick a food or enter a name");
      return;
    }
    if (grams <= 0 || grams > 5000) {
      toast.error("Portion must be 1-5000g");
      return;
    }
    const macros = selected
      ? scaleFood(selected, grams)
      : {
          calories: Number(customCals) || 0,
          protein: Number(customProtein) || 0,
          carbs: Number(customCarbs) || 0,
          fat: Number(customFat) || 0,
        };

    setLoading(true);
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_name: name.slice(0, 120),
      meal_type: meal,
      portion_grams: grams,
      logged_at: date,
      ...macros,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${name}`);
    setSelected(null);
    setCustomName("");
    setCustomCals(""); setCustomProtein(""); setCustomCarbs(""); setCustomFat("");
    setCustomMode(false);
    setQuery("");
    setGrams(100);
    loadDay();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLogs((l) => l.filter((x) => x.id !== id));
  };

  const totals = logs.reduce(
    (a, l) => ({
      calories: a.calories + l.calories,
      protein: a.protein + Number(l.protein),
      carbs: a.carbs + Number(l.carbs),
      fat: a.fat + Number(l.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const byMeal = MEALS.map((m) => ({
    meal: m,
    items: logs.filter((l) => l.meal_type === m),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Food Log</h1>
          <p className="text-sm text-muted-foreground">Search foods, log portions and track macros.</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
      </div>

      {/* Add food */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Add a food</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="scan">Scan barcode</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="mt-3">
              <UsdaFoodSearch date={date} onLogged={loadDay} />
            </TabsContent>
            <TabsContent value="scan" className="mt-3">
              <BarcodeScanner date={date} onLogged={loadDay} />
            </TabsContent>
          </Tabs>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">or quick add</span></div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search 35+ foods (e.g. chicken, oats, banana)"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
              maxLength={60}
            />
          </div>
          {query && !selected && (
            <div className="max-h-56 overflow-auto border rounded-md divide-y">
              {results.length === 0 && <div className="p-3 text-sm text-muted-foreground">No matches — log a custom food below.</div>}
              {results.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => { setSelected(f); setQuery(f.name); }}
                  className="w-full text-left p-3 hover:bg-secondary flex justify-between items-center"
                >
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{f.calories} kcal · P{f.protein} C{f.carbs} F{f.fat} /100g</span>
                </button>
              ))}
            </div>
          )}

          {!selected && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="cn" className="text-xs">Or add a custom food</Label>
                <button
                  type="button"
                  onClick={() => setCustomMode((v) => !v)}
                  className="text-xs text-primary hover:underline"
                >
                  {customMode ? "Cancel custom" : "+ Custom food"}
                </button>
              </div>
              {customMode && (
                <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-3">
                  <Input id="cn" placeholder="Custom food name" value={customName} onChange={(e) => setCustomName(e.target.value)} maxLength={120} />
                  <p className="text-xs text-muted-foreground">Enter macros for the full portion you logged.</p>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label htmlFor="ccal" className="text-xs">Calories</Label>
                      <Input id="ccal" type="number" min={0} max={10000} value={customCals} onChange={(e) => setCustomCals(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label htmlFor="cp" className="text-xs">Protein</Label>
                      <Input id="cp" type="number" min={0} max={1000} step="0.1" value={customProtein} onChange={(e) => setCustomProtein(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label htmlFor="cc" className="text-xs">Carbs</Label>
                      <Input id="cc" type="number" min={0} max={1000} step="0.1" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                    <div>
                      <Label htmlFor="cf" className="text-xs">Fat</Label>
                      <Input id="cf" type="number" min={0} max={1000} step="0.1" value={customFat} onChange={(e) => setCustomFat(e.target.value === "" ? "" : Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="g">Portion (g)</Label>
              <Input id="g" type="number" min={1} max={5000} value={grams} onChange={(e) => setGrams(Number(e.target.value))} />
            </div>
            <div>
              <Label>Meal</Label>
              <Select value={meal} onValueChange={(v) => setMeal(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selected && (
            <div className="rounded-md bg-secondary p-3 text-sm grid grid-cols-4 gap-2 text-center">
              {(() => {
                const s = scaleFood(selected, grams);
                return (
                  <>
                    <div><div className="font-semibold">{s.calories}</div><div className="text-xs text-muted-foreground">kcal</div></div>
                    <div><div className="font-semibold">{s.protein}g</div><div className="text-xs text-muted-foreground">protein</div></div>
                    <div><div className="font-semibold">{s.carbs}g</div><div className="text-xs text-muted-foreground">carbs</div></div>
                    <div><div className="font-semibold">{s.fat}g</div><div className="text-xs text-muted-foreground">fat</div></div>
                  </>
                );
              })()}
            </div>
          )}

          <Button onClick={addFood} disabled={loading} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Log food
          </Button>
        </CardContent>
      </Card>

      {/* Daily totals */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Daily totals</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-4 gap-3 text-center">
          <Stat label="Calories" value={totals.calories} unit="kcal" />
          <Stat label="Protein" value={totals.protein.toFixed(0)} unit="g" />
          <Stat label="Carbs" value={totals.carbs.toFixed(0)} unit="g" />
          <Stat label="Fat" value={totals.fat.toFixed(0)} unit="g" />
        </CardContent>
      </Card>

      {/* Meals */}
      <div className="grid gap-4 md:grid-cols-2">
        {byMeal.map(({ meal: m, items }) => {
          const mt = items.reduce(
            (a, l) => ({
              calories: a.calories + l.calories,
              protein: a.protein + Number(l.protein),
              carbs: a.carbs + Number(l.carbs),
              fat: a.fat + Number(l.fat),
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 },
          );
          return (
            <Card key={m}>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base capitalize">{m}</CardTitle>
                <Badge variant="secondary">{mt.calories} kcal</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing logged.</p>}
                {items.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 text-sm border-b last:border-0 pb-2 last:pb-0">
                    <div>
                      <div className="font-medium">{l.food_name}</div>
                      <div className="text-xs text-muted-foreground">{l.portion_grams}g · P{Number(l.protein).toFixed(0)} C{Number(l.carbs).toFixed(0)} F{Number(l.fat).toFixed(0)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{l.calories}</span>
                      <Button size="icon" variant="ghost" onClick={() => remove(l.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {items.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-1">P {mt.protein.toFixed(0)}g · C {mt.carbs.toFixed(0)}g · F {mt.fat.toFixed(0)}g</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Recent days</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {history.length === 0 && <p className="text-sm text-muted-foreground">No history yet.</p>}
          {history.map((d) => (
            <button
              key={d.logged_at}
              onClick={() => setDate(d.logged_at)}
              className="w-full flex justify-between items-center py-2 px-2 rounded hover:bg-secondary text-sm"
            >
              <span>{format(new Date(d.logged_at), "EEE, MMM d")}</span>
              <span className="text-muted-foreground">{d.count} items · <span className="font-semibold text-foreground">{d.calories} kcal</span></span>
            </button>
          ))}
        </CardContent>
      </Card>

      <FastingTimer />
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: number | string; unit: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label} ({unit})</div>
    </div>
  );
}