import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, ThemeName } from "@/hooks/useTheme";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Check, Loader2, LogOut, Moon, Palette, Sparkles, Sun, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HevyConnect, { HevyKeyDialog } from "@/components/HevyConnect";
import { useHevy } from "@/hooks/useHevy";
import { PageTitle } from "@/components/AppLayout";
import ProgressPage from "./Progress";

const THEMES: { id: ThemeName; label: string; icon: any }[] = [
  { id: "neon", label: "Neon (default)", icon: Sparkles },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "custom", label: "Custom color", icon: Palette },
];

const HUES = [0, 25, 45, 130, 170, 200, 240, 280, 320];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, hue, setHue } = useTheme();
  const nav = useNavigate();
  const [strava, setStrava] = useState<{ connected: boolean; athlete?: { firstname?: string; lastname?: string } | null } | null>(null);
  const [stravaBusy, setStravaBusy] = useState(false);
  const { status: hevyStatus, loadStatus: loadHevy } = useHevy(user?.id);
  const [hevyDialog, setHevyDialog] = useState(false);

  const loadStrava = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("strava-status");
      if (!error) setStrava(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!user) return;
    loadStrava();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connectStrava = async () => {
    setStravaBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("strava-oauth-start", { body: { origin: window.location.origin } });
      if (error || !data?.url) throw new Error(error?.message ?? "Failed to start Strava connection");
      window.location.href = data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not connect Strava");
      setStravaBusy(false);
    }
  };

  const disconnectStrava = async () => {
    setStravaBusy(true);
    try {
      const { error } = await supabase.functions.invoke("strava-disconnect");
      if (error) throw error;
      toast.success("Strava disconnected");
      setStrava({ connected: false, athlete: null });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to disconnect");
    } finally {
      setStravaBusy(false);
    }
  };

  const initial = (user?.email ?? "?").charAt(0).toUpperCase();

  const displayName =
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    (user?.email ?? "").split("@")[0];

  const themeCard = (
      <Card>
        <CardHeader><CardTitle className="text-lg">Theme</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                theme === t.id ? "bg-primary/15 text-primary" : "hover:bg-secondary/60",
              )}
            >
              <t.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{t.label}</span>
              {theme === t.id && <Check className="h-4 w-4" />}
            </button>
          ))}
          {theme === "custom" && (
            <div className="pt-2 space-y-2">
              <p className="text-xs text-muted-foreground">Pick a hue</p>
              <div className="grid grid-cols-9 gap-1">
                {HUES.map((h) => (
                  <button
                    key={h}
                    onClick={() => setHue(h)}
                    aria-label={`hue ${h}`}
                    className={cn("h-6 w-6 rounded-full border-2 transition-transform hover:scale-110", hue === h ? "border-foreground" : "border-transparent")}
                    style={{ backgroundColor: `hsl(${h} 90% 55%)` }}
                  />
                ))}
              </div>
              <input type="range" min={0} max={359} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>
  );

  return (
    <div className="space-y-6">
      <PageTitle title="Me" />

      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-secondary border-2 border-primary flex items-center justify-center shadow-[0_6px_20px_hsl(var(--primary)/0.35)]">
            <span className="text-lg font-semibold">{initial}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-base font-semibold truncate"><User className="h-4 w-4" /> {displayName}</div>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Strava</CardTitle></CardHeader>
        <CardContent>
          {strava?.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-[#fc4c02]" />
                <span className="truncate">{strava.athlete?.firstname || "Athlete"} {strava.athlete?.lastname || ""}</span>
              </div>
              <Button size="sm" variant="outline" className="w-full" disabled={stravaBusy} onClick={disconnectStrava}>
                {stravaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect Strava"}
              </Button>
            </div>
          ) : (
            <Button size="sm" className="w-full bg-[#fc4c02] hover:bg-[#e34402] text-white" disabled={stravaBusy} onClick={connectStrava}>
              {stravaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
              Connect Strava
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Hevy</CardTitle></CardHeader>
        <CardContent>
          <HevyConnect status={hevyStatus} onChange={() => loadHevy()} onRequestConnect={() => setHevyDialog(true)} />
        </CardContent>
      </Card>

      <ProgressPage />

      <Button variant="outline" className="w-full" onClick={async () => { await signOut(); nav("/auth"); }}>
        <LogOut className="h-4 w-4 mr-2" /> Sign out
      </Button>

      <HevyKeyDialog open={hevyDialog} onOpenChange={setHevyDialog} onConnected={() => loadHevy()} />
    </div>
  );
}