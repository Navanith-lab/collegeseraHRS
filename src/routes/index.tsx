import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import {
  Users,
  Clock,
  CalendarDays,
  ShieldCheck,
  LineChart,
  Megaphone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CollegeSera HRMS" },
      {
        name: "description",
        content:
          "Manage your workforce — employees, payroll, performance, and more. People operations platform for CollegeSera.",
      },
      { property: "og:title", content: "CollegeSera HRMS" },
      {
        property: "og:description",
        content:
          "Manage your workforce — employees, payroll, performance, and more. People operations platform for CollegeSera.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const features = [
  { icon: Users, title: "Employee Directory", desc: "Complete profiles, departments, reporting lines, documents." },
  { icon: Clock, title: "Attendance", desc: "One-click check-in/out, regularization, monthly calendar." },
  { icon: CalendarDays, title: "Leave Management", desc: "Multi-level approval flow with balances and history." },
  { icon: ShieldCheck, title: "Role-based Access", desc: "Super Admin, HR, Manager and Employee scopes." },
  { icon: LineChart, title: "Reports & Analytics", desc: "Dashboards for every role, exportable reports." },
  { icon: Megaphone, title: "Announcements", desc: "Company news, circulars, events and holidays." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <BrandLogo />
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/60 to-background">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
              <span className="h-2 w-2 rounded-full bg-accent" />
              People Operations Platform for CollegeSera
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              People operations, <span className="text-accent">simplified</span>.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Manage your workforce — employees, attendance, leaves, payroll, performance and
              announcements — in one secure workspace with role-based dashboards.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Launch the workspace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/auth">Explore a demo</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border bg-card p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { l: "Total employees", v: "248" },
                  { l: "On leave today", v: "12" },
                  { l: "Pending approvals", v: "7" },
                ].map((s) => (
                  <div key={s.l} className="rounded-lg border bg-secondary/40 p-3">
                    <div className="text-2xl font-semibold">{s.v}</div>
                    <div className="text-xs text-muted-foreground">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Attendance this week</div>
                  <div className="flex h-24 items-end gap-1">
                    {[60, 82, 74, 90, 88, 40, 20].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-primary/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">Leave breakdown</div>
                  <div className="space-y-2 text-xs">
                    {[
                      { l: "Casual", v: 40, c: "bg-primary" },
                      { l: "Sick", v: 25, c: "bg-accent" },
                      { l: "WFH", v: 20, c: "bg-success" },
                      { l: "Others", v: 15, c: "bg-muted-foreground" },
                    ].map((r) => (
                      <div key={r.l}>
                        <div className="mb-1 flex justify-between">
                          <span>{r.l}</span>
                          <span className="text-muted-foreground">{r.v}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                          <div className={`h-full rounded-full ${r.c}`} style={{ width: `${r.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Everything HR needs, in one place</h2>
          <p className="mt-3 text-muted-foreground">
            Modular by design — start with the essentials and grow into payroll, tickets and
            documents without changing your workflow.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 md:flex-row">
          <BrandLogo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CollegeSera. Built for modern people teams.
          </p>
        </div>
      </footer>
    </div>
  );
}
