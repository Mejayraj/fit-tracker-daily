import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Dumbbell, Loader2, RefreshCw } from "lucide-react";
import type { HevyStatus } from "@/hooks/useHevy";

/** Compact Hevy section for the profile dropdown. */
export default function HevyConnect({
  status,
  onChange,
  onRequestConnect,
}: {
  status: HevyStatus | null;
  onChange: () => void;
  onRequestConnect: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const disconnect = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("hevy-disconnect");
      if (error) throw error;
      toast.success("Hevy disconnected");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setBusy(false);
    }
  };

  const syncNow = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("hevy-sync");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Synced ${(data as any)?.synced ?? 0} Hevy workouts`);
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-2 pb-2">
      {status?.connected ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="truncate">{status.username || "Hevy account"}</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={syncNow}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> Sync</>}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" disabled={busy} onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" className="w-full" onClick={onRequestConnect}>
          <Dumbbell className="h-4 w-4 mr-2" /> Connect Hevy
        </Button>
      )}
    </div>
  );
}

/** API-key dialog. Rendered outside the dropdown so it survives the menu closing. */
export function HevyKeyDialog({
  open,
  onOpenChange,
  onConnected,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConnected: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim().length < 10) return toast.error("Paste your Hevy API key");
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("hevy-connect", {
        body: { apiKey: apiKey.trim() },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Hevy connected${(data as any)?.username ? ` as ${(data as any).username}` : ""}`);
      setApiKey("");
      onOpenChange(false);
      onConnected();
      const { data: s } = await supabase.functions.invoke("hevy-sync");
      if ((s as any)?.synced) toast.success(`Synced ${(s as any).synced} Hevy workouts`);
      onConnected();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect Hevy");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" /> Connect Hevy
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={connect} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hevy Pro members can generate a personal API key at{" "}
            <a
              href="https://hevy.com/settings?developer"
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              hevy.com/settings?developer
            </a>
            . Paste it below — it is stored securely and never leaves the server.
          </p>
          <div>
            <Label htmlFor="hevy-key">Hevy API key</Label>
            <Input
              id="hevy-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Connect &amp; sync
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
