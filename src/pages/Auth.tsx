import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";

export default function Auth() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPwIn, setShowPwIn] = useState(false);
  const [showPwUp, setShowPwUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [user, loading, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      localStorage.setItem("rememberMe", rememberMe ? "true" : "false");
      nav("/", { replace: true });
    }
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { display_name: name } },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Account created! You're signed in.");
      nav("/", { replace: true });
    }
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else nav("/", { replace: true });
  };

  const googleBtn = (
    <>
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-white/30" />
        <span className="text-xs text-white/40">or continue with</span>
        <span className="h-px flex-1 bg-white/30" />
      </div>
      <button type="button" onClick={signInWithGoogle} disabled={busy} className="auth-glass-btn w-full py-3.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z" />
          <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
          <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
        </svg>
        Continue with Google
      </button>
    </>
  );

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-5 py-10">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full blur-[120px]" style={{ background: "radial-gradient(circle, rgba(57,255,20,0.04), transparent 70%)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-24 h-[420px] w-[420px] rounded-full blur-[120px]" style={{ background: "radial-gradient(circle, rgba(20,120,40,0.02), transparent 70%)" }} />

      <div className="auth-in relative w-full max-w-md">
        <header className="text-center mb-7">
          <div
            className="mx-auto h-20 w-20 overflow-hidden"
            style={{
              borderRadius: 20,
              boxShadow:
                "0 0 0 1.5px rgba(57,255,20,0.3), 0 0 24px rgba(57,255,20,0.2)",
            }}
          >
            <img
              src={logo}
              alt="Kadak Fitness logo"
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="mt-4 text-[28px] font-semibold text-white leading-tight">Kadak Fitness</h1>
          <p className="mt-1 text-sm" style={{ color: "#888" }}>Train Hard. Track Smart.</p>
        </header>

        <section className="auth-card px-7 py-8">
          <Tabs defaultValue="signin">
            <TabsList className="auth-tabs grid grid-cols-2 w-full h-auto">
              <TabsTrigger value="signin" className="auth-tab py-2.5 text-sm font-medium data-[state=active]:bg-[rgba(57,255,20,0.15)] data-[state=active]:text-[#39FF14] data-[state=active]:border-[rgba(57,255,20,0.3)] data-[state=active]:shadow-none">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="auth-tab py-2.5 text-sm font-medium data-[state=active]:bg-[rgba(57,255,20,0.15)] data-[state=active]:text-[#39FF14] data-[state=active]:border-[rgba(57,255,20,0.3)] data-[state=active]:shadow-none">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="animate-fade-in">
              <form onSubmit={signIn} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="ei" className="text-xs text-white/60">Email</Label>
                  <Input id="ei" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pi" className="text-xs text-white/60">Password</Label>
                  <div className="relative">
                    <Input id="pi" type={showPwIn ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input pr-11" />
                    <button type="button" onClick={() => setShowPwIn((v) => !v)} aria-label={showPwIn ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      {showPwIn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer text-white/60">Remember me</Label>
                </div>
                <button type="submit" disabled={busy} className="auth-primary-btn w-full text-sm disabled:opacity-60">
                  {busy ? "Signing in..." : "Sign In"}
                </button>
              </form>
              {googleBtn}
            </TabsContent>

            <TabsContent value="signup" className="animate-fade-in">
              <form onSubmit={signUp} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="n" className="text-xs text-white/60">Name</Label>
                  <Input id="n" value={name} onChange={(e) => setName(e.target.value)} className="auth-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eu" className="text-xs text-white/60">Email</Label>
                  <Input id="eu" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pu" className="text-xs text-white/60">Password</Label>
                  <div className="relative">
                    <Input id="pu" type={showPwUp ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input pr-11" />
                    <button type="button" onClick={() => setShowPwUp((v) => !v)} aria-label={showPwUp ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                      {showPwUp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={busy} className="auth-primary-btn w-full text-sm disabled:opacity-60">
                  {busy ? "Creating..." : "Create Account"}
                </button>
              </form>
              {googleBtn}
            </TabsContent>
          </Tabs>
        </section>

        <p className="text-center text-xs text-white/40 mt-6">
          Created by <span className="font-semibold text-white/70">Mejayraj.</span>
        </p>
      </div>
    </main>
  );
}