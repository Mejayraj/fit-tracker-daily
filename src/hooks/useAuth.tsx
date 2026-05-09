import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthCtx = { user: User | null; session: Session | null; loading: boolean; signOut: () => Promise<void> };
const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

const AUTH_TOKEN_KEY = "sb-auth-token-backup";

function findSupabaseAuthKey(): string | null {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) return k;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from sessionStorage backup (for non-remember-me users on refresh)
    const backup = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (backup) {
      const key = findSupabaseAuthKey();
      if (!key) {
        const realKey = Object.keys(JSON.parse(backup))[0] ?? "sb-auth-token";
        const data = JSON.parse(backup)[realKey];
        localStorage.setItem(realKey, JSON.stringify(data));
      }
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localStorage.getItem("rememberMe") !== "false") return;
      const key = findSupabaseAuthKey();
      if (key) {
        const data = localStorage.getItem(key);
        if (data) {
          sessionStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify({ [key]: JSON.parse(data) }));
          localStorage.removeItem(key);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
          localStorage.removeItem("rememberMe");
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);