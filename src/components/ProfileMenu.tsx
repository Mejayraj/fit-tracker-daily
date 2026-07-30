import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, ThemeName } from "@/hooks/useTheme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Palette, Sun, Moon, Sparkles, User, Check, Activity, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HevyConnect, { HevyKeyDialog } from "@/components/HevyConnect";
import { useHevy } from "@/hooks/useHevy";

const THEMES: { id: ThemeName; label: string; icon: any }[] = [
  { id: "neon", label: "Neon (default)", icon: Sparkles },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "custom", label: "Custom color", icon: Palette },
];

const HUES = [0, 25, 45, 130, 170, 200, 240, 280, 320];

export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, hue, setHue } = useTheme();
  const nav = useNavigate();
  const initial = (user?.email ?? "?").charAt(0).toUpperCase();
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
    const params = new URLSearchParams(window.location.search);
    if (params.get("strava") === "connected") {
      toast.success("Strava connected!");
      params.delete("strava");
      const q = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (q ? `?${q}` : ""));
      loadStrava();
    }
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

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-secondary text-foreground hover:bg-secondary/80">
          <span className="text-sm font-semibold">{initial}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="truncate text-xs font-normal text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Theme</DropdownMenuLabel>
        {THEMES.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={(e) => { e.preventDefault(); setTheme(t.id); }} className="cursor-pointer">
            <t.icon className="h-4 w-4 mr-2" />
            <span className="flex-1">{t.label}</span>
            {theme === t.id && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        {theme === "custom" && (
          <div className="px-2 py-2 space-y-2">
            <p className="text-xs text-muted-foreground">Pick a hue</p>
            <div className="grid grid-cols-9 gap-1">
              {HUES.map((h) => (
                <button
                  key={h}
                  onClick={() => setHue(h)}
                  aria-label={`hue ${h}`}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                    hue === h ? "border-foreground" : "border-transparent",
                  )}
                  style={{ backgroundColor: `hsl(${h} 90% 55%)` }}
                />
              ))}
            </div>
            <input
              type="range" min={0} max={359} value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Strava</DropdownMenuLabel>
        <div className="px-2 pb-2">
          {strava?.connected ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-[#fc4c02]" />
                <span className="truncate">
                  {strava.athlete?.firstname || "Athlete"} {strava.athlete?.lastname || ""}
                </span>
              </div>
              <Button size="sm" variant="outline" className="w-full" disabled={stravaBusy} onClick={disconnectStrava}>
                {stravaBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect Strava"}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="w-full bg-[#fc4c02] hover:bg-[#e34402] text-white"
              disabled={stravaBusy}
              onClick={connectStrava}
            >
              {stravaBusy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}
              Connect Strava
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Hevy</DropdownMenuLabel>
        <HevyConnect
          status={hevyStatus}
          onChange={() => { loadHevy(); }}
          onRequestConnect={() => setHevyDialog(true)}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={async () => { await signOut(); nav("/auth"); }} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <HevyKeyDialog open={hevyDialog} onOpenChange={setHevyDialog} onConnected={() => loadHevy()} />
    </>
  );
}