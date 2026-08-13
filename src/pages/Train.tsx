import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useHevy } from "@/hooks/useHevy";
import Workouts from "./Workouts";
import Exercises from "./Exercises";
import TrainHistory from "@/components/train/TrainHistory";
import LogExerciseSheet from "@/components/train/LogExerciseSheet";
import { cn } from "@/lib/utils";

const TABS = ["Log", "History", "Exercises"] as const;
type Tab = (typeof TABS)[number];

export default function Train() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("Log");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const today = format(new Date(), "yyyy-MM-dd");
  const { status, workouts, syncing, sync } = useHevy(user?.id);

  return (
    <div className="space-y-5">
      <PageTitle title="Train" />

      <div
        className="flex items-center gap-1 rounded-[20px] p-1"
        style={{ background: "hsl(var(--foreground) / 0.06)" }}
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-[16px] py-2 text-sm font-medium transition-colors border",
              tab === t
                ? "bg-primary/15 text-primary border-primary/30"
                : "border-transparent text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Log" && <Workouts hevyWorkouts={workouts} refreshKey={refreshKey} />}
      {tab === "History" && (
        <TrainHistory
          workouts={workouts}
          excludeDate={today}
          connected={!!status?.connected}
          syncing={syncing}
          onSync={() => { sync().catch((e) => toast.error(e instanceof Error ? e.message : "Sync failed")); }}
        />
      )}
      {tab === "Exercises" && <Exercises onLogged={() => setRefreshKey((k) => k + 1)} />}
      <LogExerciseSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        date={today}
        onLogged={() => { setRefreshKey((k) => k + 1); setTab("Log"); }}
      />
    </div>
  );
}