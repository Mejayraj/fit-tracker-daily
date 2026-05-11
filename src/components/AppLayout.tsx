import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Dumbbell, UtensilsCrossed, LineChart, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileMenu from "@/components/ProfileMenu";
import logo from "@/assets/logo.png";

const tabs = [
  { to: "/", label: "Dashboard", icon: Home, end: true },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/exercises", label: "Exercises", icon: Library },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/progress", label: "Progress", icon: LineChart },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-60">
      {/* Sidebar (md+) */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col border-r bg-card">
        <div className="p-5 flex items-center gap-2">
          <img src={logo} alt="Get Fit logo" className="h-9 w-9 rounded-lg" />
          <span className="font-semibold text-lg">Get Fit</span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/80",
                )
              }
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground truncate px-2">{user?.email}</p>
        </div>
      </aside>

      {/* Desktop top bar */}
      <header className="hidden md:flex sticky top-0 z-10 bg-background/70 backdrop-blur border-b px-6 py-3 items-center justify-end">
        <ProfileMenu />
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-10 bg-card/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Get Fit logo" className="h-8 w-8 rounded-md" />
          <span className="font-semibold">Get Fit</span>
        </div>
        <ProfileMenu />
      </header>

      <main className="p-4 md:p-8 max-w-5xl mx-auto">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t z-10">
        <div className="grid grid-cols-5">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-3 text-xs",
                  isActive ? "text-primary" : "text-muted-foreground",
                )
              }
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
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