import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — CollegeSera HRMS" },
      {
        name: "description",
        content: "Sign in to CollegeSera HRMS to manage employees, attendance, and leaves.",
      },
    ],
  }),
});

function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    window.location.href = "/dashboard";
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — signing you in…");
    window.location.href = "/dashboard";
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <BrandLogo variant="light" />
        <div className="max-w-md space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            One workspace for your entire people operations.
          </h1>
          <p className="text-primary-foreground/80">
            Manage employees, attendance, leaves, payroll and performance — a modern people
            operations platform for CollegeSera.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-primary-foreground/90">
            {[
              { k: "Roles", v: "4" },
              { k: "Modules", v: "10+" },
              { k: "Mobile-ready", v: "100%" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-white/5 p-4 backdrop-blur">
                <div className="text-2xl font-semibold text-accent">{s.v}</div>
                <div className="text-xs uppercase tracking-wider">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-primary-foreground/60">© CollegeSera. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1">
            <div className="lg:hidden">
              <BrandLogo />
            </div>
            <CardTitle className="text-2xl">Sign in to your workspace</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use your work email. First user becomes Super Admin automatically.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="e1">Email</Label>
                    <Input id="e1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p1">Password</Label>
                    <Input id="p1" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="n2">Full name</Label>
                    <Input id="n2" required value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="e2">Email</Label>
                    <Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="p2">Password</Label>
                    <Input id="p2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating…" : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link to="/" className="hover:underline">← Back to home</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
