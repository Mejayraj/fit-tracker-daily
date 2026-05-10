import { useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Plus, Loader2, Database } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner", "snack"] as const;

type UsdaFood = {
  fdcId: number;
  description: string;
  brandName?: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
};

// USDA nutrient numbers (per 100g for Foundation/SR Legacy/Survey foods)
const NUTRIENT_IDS = { calories: "1008", protein: "1003", carbs: "1005", fat: "1004" };

function extractMacros(food: any): UsdaFood["per100g"] {
  const out = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const n of food.foodNutrients ?? []) {
    const id = String(n.nutrientId ?? n.nutrient?.id ?? "");
    const val = Number(n.value ?? n.amount ?? 0);
    if (id === NUTRIENT_IDS.calories) out.calories = Math.round(val);
    else if (id === NUTRIENT_IDS.protein) out.protein = Math.round(val * 10) / 10;
    else if (id === NUTRIENT_IDS.carbs) out.carbs = Math.round(val * 10) / 10;
    else if (id === NUTRIENT_IDS.fat) out.fat = Math.round(val * 10) / 10;
  }
  return out;
}

export default function UsdaFoodSearch({ date, onLogged }: { date: string; onLogged?: () => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UsdaFood[] | null>(null);
  const [grams, setGrams] = useState<Record<number, number>>({});
  const [meal, setMeal] = useState<(typeof MEALS)[number]>("snack");
  const [logging, setLogging] = useState<number | null>(null);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(q)}&pageSize=10&api_key=DEMO_KEY`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`USDA API error (${res.status})`);
      const data = await res.json();
      const foods: UsdaFood[] = (data.foods ?? []).map((f: any) => ({
        fdcId: f.fdcId,
        description: f.description,
        brandName: f.brandName || f.brandOwner,
        per100g: extractMacros(f),
      }));
      setResults(foods);
    } catch (err: any) {
      toast.error(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const logFood = async (food: UsdaFood) => {
    if (!user) return toast.error("Sign in required");
    const g = grams[food.fdcId] ?? 100;
    if (g <= 0 || g > 5000) return toast.error("Serving must be 1-5000g");
    const factor = g / 100;
    const macros = {
      calories: Math.round(food.per100g.calories * factor),
      protein: Math.round(food.per100g.protein * factor * 10) / 10,
      carbs: Math.round(food.per100g.carbs * factor * 10) / 10,
      fat: Math.round(food.per100g.fat * factor * 10) / 10,
    };
    setLogging(food.fdcId);
    const { error } = await supabase.from("food_logs").insert({
      user_id: user.id,
      food_name: food.description.slice(0, 120),
      meal_type: meal,
      portion_grams: g,
      logged_at: date,
      ...macros,
    });
    setLogging(null);
    if (error) return toast.error(error.message);
    toast.success(`Logged ${food.description.slice(0, 40)} · ${macros.calories} kcal`);
    onLogged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Database className="h-4 w-4 text-primary" /> USDA Food Search
      </div>
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search USDA database (e.g. greek yogurt, salmon)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
        <div>
          <Label className="text-xs">Meal for logged items</Label>
          <Select value={meal} onValueChange={(v) => setMeal(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MEALS.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {results && results.length === 0 && (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground text-center">
          No results. Try another search term.
        </div>
      )}

      {results && results.length > 0 && (
        <div className="grid gap-2">
          {results.map((f) => {
            const g = grams[f.fdcId] ?? 100;
            const factor = g / 100;
            return (
              <div key={f.fdcId} className="rounded-lg border bg-card p-3 space-y-2">
                <div>
                  <div className="font-medium text-sm leading-tight">{f.description}</div>
                  {f.brandName && <div className="text-xs text-muted-foreground">{f.brandName}</div>}
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-xs bg-secondary/50 rounded-md p-2">
                  <div><div className="font-semibold text-sm">{f.per100g.calories}</div><div className="text-muted-foreground">kcal</div></div>
                  <div><div className="font-semibold text-sm">{f.per100g.protein}g</div><div className="text-muted-foreground">protein</div></div>
                  <div><div className="font-semibold text-sm">{f.per100g.carbs}g</div><div className="text-muted-foreground">carbs</div></div>
                  <div><div className="font-semibold text-sm">{f.per100g.fat}g</div><div className="text-muted-foreground">fat</div></div>
                </div>
                <div className="text-[10px] text-muted-foreground -mt-1">Per 100g</div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Serving (g)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5000}
                      value={g}
                      onChange={(e) => setGrams((s) => ({ ...s, [f.fdcId]: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground pb-2 whitespace-nowrap">
                    = {Math.round(f.per100g.calories * factor)} kcal
                  </div>
                  <Button size="sm" onClick={() => logFood(f)} disabled={logging === f.fdcId}>
                    {logging === f.fdcId ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Log</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}