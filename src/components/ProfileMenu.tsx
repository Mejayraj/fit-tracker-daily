import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, ThemeName } from "@/hooks/useTheme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Palette, Sun, Moon, Sparkles, User, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
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
        <DropdownMenuItem onSelect={async () => { await signOut(); nav("/auth"); }} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}