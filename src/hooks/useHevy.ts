import { hapticSync } from "@/lib/haptics";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HevyWorkout = {
  id: string;
  hevy_id: string;
  title: string;
  start_time: string;
  duration_minutes: number;
  total_volume_kg: number;
  total_reps: number;
  total_sets: number;
  calories_estimate: number;
};

export type HevyStatus = {
  connected: boolean;
  username: string | null;
  lastSyncedAt: string | null;
};

const STALE_MS = 15 * 60 * 1000;

export function useHevy(userId?: string) {
  const [status, setStatus] = useState<HevyStatus | null>(null);
  const [workouts, setWorkouts] = useState<HevyWorkout[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadWorkouts = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("hevy_workouts")
      .select("id,hevy_id,title,start_time,duration_minutes,total_volume_kg,total_reps,total_sets,calories_estimate")
      .eq("user_id", userId)
      .order("start_time", { ascending: false })
      .limit(50);
    setWorkouts((data ?? []).map((w: any) => ({ ...w, total_volume_kg: Number(w.total_volume_kg) })));
  }, [userId]);

  const loadStatus = useCallback(async () => {
    if (!userId) return null;
    const { data, error } = await supabase.functions.invoke("hevy-status");
    if (error) return null;
    setStatus(data as HevyStatus);
    return data as HevyStatus;
  }, [userId]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("hevy-sync");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      await loadWorkouts();
      await loadStatus();
      hapticSync();
      return (data as any)?.synced ?? 0;
    } finally {
      setSyncing(false);
    }
  }, [loadWorkouts, loadStatus]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const s = await loadStatus();
      if (cancelled || !s?.connected) return;
      await loadWorkouts();
      const stale = !s.lastSyncedAt || Date.now() - new Date(s.lastSyncedAt).getTime() > STALE_MS;
      if (stale && !cancelled) {
        try { await sync(); } catch { /* silent background sync failure */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return { status, workouts, syncing, sync, loadWorkouts, loadStatus, setStatus };
}
