import { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Home, Dumbbell, UtensilsCrossed, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/food", label: "Nutrition", icon: UtensilsCrossed },
  { to: "/train", label: "Train", icon: Dumbbell },
  { to: "/me", label: "Me", icon: User },
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
  const { pathname } = useLocation();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to))),
  );
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 pointer-events-none"
      style={{ paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}
    >
      <div className="glass-nav pointer-events-auto relative mx-4 flex items-center justify-between px-1.5 py-1.5">
        <div
          className="nav-pill pointer-events-none absolute left-1.5 top-1.5 bottom-1.5 rounded-[28px] bg-primary/15"
          style={{
            width: `calc((100% - 12px) / ${tabs.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              cn(
                "relative z-10 flex flex-1 flex-col items-center gap-0.5 rounded-[28px] px-1 py-2 text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
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
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 max-w-lg mx-auto" style={{ paddingTop: 60, paddingBottom: 100 }}>
        <div key={pathname}>
          {children}
        </div>
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