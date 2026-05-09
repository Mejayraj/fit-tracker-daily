import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import bg1 from "@/assets/auth-bg.jpg";
import bg2 from "@/assets/auth-bg-2.jpg";
import bg3 from "@/assets/auth-bg-3.jpg";

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
  const bgs = [bg1, bg2, bg3];
  const [bgIdx, setBgIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBgIdx((i) => (i + 1) % bgs.length), 6000);
    return () => clearInterval(t);
  }, []);

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

  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Athlete photo slideshow */}
      {bgs.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          aria-hidden
          className={`absolute inset-0 -z-20 h-full w-full object-cover transition-opacity duration-[1500ms] ${i === bgIdx ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      {/* Simple dark overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-black/60"
      />

      <Card className="w-full max-w-md shadow-elegant border-white/15 bg-white/10 backdrop-blur-2xl ring-1 ring-white/15">
        <CardHeader className="text-center">
          <img src={logo} alt="Get Fit logo" className="mx-auto h-16 w-16 rounded-xl mb-2 drop-shadow-[0_0_18px_hsl(var(--primary)/0.6)]" />
          <CardTitle className="text-glow-primary">Get Fit</CardTitle>
          <CardDescription>Your personal fitness & nutrition log</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-3 mt-4">
                <div><Label htmlFor="ei">Email</Label><Input id="ei" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div>
                  <Label htmlFor="pi">Password</Label>
                  <div className="relative">
                    <Input id="pi" type={showPwIn ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPwIn((v) => !v)} aria-label={showPwIn ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                    className="h-4 w-4 rounded border-muted-foreground/30 bg-transparent accent-primary"
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label htmlFor="eu">Email</Label><Input id="eu" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div>
                  <Label htmlFor="pu">Password</Label>
                  <div className="relative">
                    <Input id="pu" type={showPwUp ? "text" : "password"} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPwUp((v) => !v)} aria-label={showPwUp ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwUp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating..." : "Create Account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Created by <span className="font-semibold text-foreground">Mejayraj.</span>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}