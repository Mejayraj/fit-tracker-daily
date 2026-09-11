import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { hapticLight } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Goals = { calorie_goal: number; protein_goal: number; carb_goal: number; fat_goal: number };
const DEFAULTS: Goals = { calorie_goal: 2200, protein_goal: 150, carb_goal: 250, fat_goal: 70 };

export default function GoalsCard() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goals>(DEFAULTS);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Goals>(DEFAULTS);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("calorie_goal,protein_goal,carb_goal,fat_goal")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const g = {
            calorie_goal: data.calorie_goal ?? DEFAULTS.calorie_goal,
            protein_goal: data.protein_goal ?? DEFAULTS.protein_goal,
            carb_goal: data.carb_goal ?? DEFAULTS.carb_goal,
            fat_goal: data.fat_goal ?? DEFAULTS.fat_goal,
          };
          setGoals(g);
          setForm(g);
        }
      });
  }, [user?.id]);

  const save = async () => {
    if (!user) return;
    const { calorie_goal, protein_goal, carb_goal, fat_goal } = form;
    if (calorie_goal < 500 || calorie_goal > 10000) return toast.error("Calories must be 500–10,000");
    if ([protein_goal, carb_goal, fat_goal].some((v) => v < 0 || v > 1000))
      return toast.error("Macros must be 0–1,000 g");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ calorie_goal, protein_goal, carb_goal, fat_goal })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setGoals(form);
    setOpen(false);
    vibrateLight();
    toast.success("Goals updated");
  };

  const num = (v: string) => (v === "" ? 0 : Math.max(0, Math.round(Number(v) || 0)));

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold">Daily Goals</div>
              <div className="text-xs text-muted-foreground truncate">
                {goals.calorie_goal} kcal · P {goals.protein_goal}g · C {goals.carb_goal}g · F {goals.fat_goal}g
              </div>
            </div>
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-300", open && "rotate-180")}
          />
        </button>

        <div
          className="grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label htmlFor="goal-cal" className="text-xs">Daily calories</Label>
                  <Input
                    id="goal-cal"
                    type="number"
                    min={500}
                    max={10000}
                    value={form.calorie_goal}
                    onChange={(e) => setForm((f) => ({ ...f, calorie_goal: num(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="goal-p" className="text-xs">Protein (g)</Label>
                  <Input
                    id="goal-p"
                    type="number"
                    min={0}
                    max={1000}
                    value={form.protein_goal}
                    onChange={(e) => setForm((f) => ({ ...f, protein_goal: num(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="goal-c" className="text-xs">Carbs (g)</Label>
                  <Input
                    id="goal-c"
                    type="number"
                    min={0}
                    max={1000}
                    value={form.carb_goal}
                    onChange={(e) => setForm((f) => ({ ...f, carb_goal: num(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="goal-f" className="text-xs">Fat (g)</Label>
                  <Input
                    id="goal-f"
                    type="number"
                    min={0}
                    max={1000}
                    value={form.fat_goal}
                    onChange={(e) => setForm((f) => ({ ...f, fat_goal: num(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-gradient-primary text-primary-foreground"
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save goals"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={saving}
                  onClick={() => { setForm(goals); setOpen(false); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
