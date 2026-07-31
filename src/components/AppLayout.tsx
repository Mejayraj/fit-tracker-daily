import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Dumbbell, UtensilsCrossed, LineChart, Library, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const tabs = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/food", label: "Nutrition", icon: UtensilsCrossed },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/exercises", label: "Exercise", icon: Library },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/profile", label: "Profile", icon: User },
];

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight leading-tight text-foreground">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <div className="glass-nav pointer-events-auto mx-4 flex items-center justify-between px-1.5 py-1.5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-[28px] px-1 py-2 text-[10px] font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <t.icon className="h-[18px] w-[18px]" />
            <span className="leading-none">{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  useAuth();
  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 max-w-lg mx-auto" style={{ paddingTop: 60, paddingBottom: 100 }}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

export function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) {
    window.location.href = "/auth";
    return null;
  }
  return <AppLayout>{children}</AppLayout>;
}