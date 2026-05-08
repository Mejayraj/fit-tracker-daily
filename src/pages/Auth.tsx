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
import { Dumbbell } from "lucide-react";

export default function Auth() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav("/", { replace: true });
  }, [user, loading, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
    else nav("/", { replace: true });
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
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2">
            <Dumbbell className="h-6 w-6" />
          </div>
          <CardTitle>Get Fit</CardTitle>
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
                <div><Label htmlFor="pi">Password</Label><Input id="pi" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in..." : "Sign In"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-3 mt-4">
                <div><Label htmlFor="n">Name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label htmlFor="eu">Email</Label><Input id="eu" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="pu">Password</Label><Input id="pu" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating..." : "Create Account"}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}