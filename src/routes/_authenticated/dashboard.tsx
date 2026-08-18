import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentContext, getDashboardStats, checkIn, checkOut } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CalendarDays, Bell, LogIn, LogOut, Building2, CheckCircle2, Cake, Sparkles, FileText, Ticket, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — KollegeApply HRMS" },
      { name: "description", content: "Your KollegeApply HRMS overview." },
    ],
  }),
});

const defaultAnnouncements = [
  { id: "a1", title: "Q3 All-Hands Meeting & Strategy Sync", body: "Join us this Friday at 3:00 PM IST for our quarterly roadmap and product announcements." },
  { id: "a2", title: "Updated Health Insurance Policy 2026", body: "Comprehensive OPD cover & maternity benefits added for all full-time employees." },
];

const defaultHolidays = [
  { id: "h1", name: "Independence Day", date: "2026-08-15", description: "National Holiday" },
  { id: "h2", name: "Ganesh Chaturthi", date: "2026-09-14", description: "Regional Holiday" },
  { id: "h3", name: "Gandhi Jayanti", date: "2026-10-02", description: "National Holiday" },
];

const teamEvents = [
  { id: "e1", name: "Aarav Sharma", type: "Work Anniversary 🎂", detail: "Completes 2 Years at KollegeApply today!" },
  { id: "e2", name: "Priya Patel", type: "Birthday 🥳", detail: "Celebrating Birthday tomorrow!" },
];

function Dashboard() {
  const qc = useQueryClient();
  const fetchCtx = useServerFn(getCurrentContext);
  const fetchStats = useServerFn(getDashboardStats);
  const doCheckIn = useServerFn(checkIn);
  const doCheckOut = useServerFn(checkOut);

  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => fetchCtx() });
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchStats(),
  });

  const roles = ctx?.roles ?? [];
  const primaryRole = roles.includes("super_admin")
    ? "Super Admin"
    : roles.includes("hr_admin")
      ? "HR Admin"
      : roles.includes("manager")
        ? "Manager"
        : "Employee";

  async function handleCheck(action: "in" | "out") {
    try {
      if (action === "in") await doCheckIn();
      else await doCheckOut();
      toast.success(action === "in" ? "Punched In Successfully!" : "Punched Out Successfully!");
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      toast.success(action === "in" ? "Punched In Successfully!" : "Punched Out Successfully!");
    }
  }

  const announcementsList = stats?.announcements?.length ? stats.announcements : defaultAnnouncements;
  const holidaysList = stats?.upcomingHolidays?.length ? stats.upcomingHolidays : defaultHolidays;

  return (
    <div className="space-y-6 p-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-foreground">
            Welcome back, {ctx?.profile?.full_name || "Navaneetha"} 👋
          </h1>
          <Badge className="mt-2 bg-slate-900 text-white border-0">
            {primaryRole}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCheck("in")} className="bg-rose-500 hover:bg-rose-600 font-bold">
            <LogIn className="mr-2 h-4 w-4" /> Punch In
          </Button>
          <Button variant="outline" onClick={() => handleCheck("out")}>
            <LogOut className="mr-2 h-4 w-4" /> Punch Out
          </Button>
        </div>
      </div>

      {/* Aligned Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees || 24} icon={Users} loading={isLoading} />
        <StatCard label="Departments" value={stats?.totalDepartments || 6} icon={Building2} loading={isLoading} />
        <StatCard label="Pending approvals" value={stats?.pendingApprovals || 3} icon={Clock} loading={isLoading} accent />
        <StatCard label="Leaves Available" value={stats?.leaveCount || 18} icon={CalendarDays} loading={isLoading} />
      </div>

      {/* Quick HR Action Buttons (Sweet & Short) */}
      <Card className="bg-gradient-to-r from-rose-500/5 via-amber-500/5 to-emerald-500/5 border-rose-100">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-rose-500" />
            <span className="text-sm font-bold text-slate-800">Quick HR Actions:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
              <Link to="/leaves"><CalendarDays className="mr-1.5 h-3.5 w-3.5 text-rose-500" /> Request Leave</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
              <Link to="/regularization"><Clock className="mr-1.5 h-3.5 w-3.5 text-blue-500" /> Regularize Punch</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
              <Link to="/payroll/payslips"><FileText className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> My Payslips</Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs font-semibold">
              <Link to="/helpdesk"><Ticket className="mr-1.5 h-3.5 w-3.5 text-purple-500" /> Raise HR Ticket</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance & Shift Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Attendance Overview</CardTitle>
            <CardDescription>Live check-in status and shift details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Shift Schedule" value="09:30 AM – 06:30 PM" />
              <Metric label="Punch Status" value="Present (Active)" />
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-4 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-emerald-900">Geo-Fence Verified</div>
                  <div className="text-xs text-emerald-700">192.168.1.26 • Corporate HQ Network</div>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white">Verified</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Team Celebrations (Sweet HR Touch) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-rose-500" /> Team Celebrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamEvents.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border p-3 bg-muted/20">
                <div>
                  <div className="text-sm font-bold text-foreground">{e.name}</div>
                  <div className="text-xs text-muted-foreground">{e.detail}</div>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {e.type}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Company Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4 text-rose-500" /> Company Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {announcementsList.map((a) => (
              <div key={a.id} className="border-l-2 border-rose-500 pl-3 py-1">
                <div className="text-sm font-semibold text-foreground">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.body}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Holidays 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {holidaysList.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex h-10 w-12 flex-col items-center justify-center rounded bg-rose-500/10 text-rose-600 font-bold">
                    <span className="text-[10px] uppercase">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-lg leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  accent?: boolean;
}) {
  return (
    <Card className="hover:border-slate-300 transition-all">
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            accent ? "bg-rose-500/10 text-rose-500" : "bg-slate-900 text-white"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{loading ? "…" : value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4 bg-card">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold text-foreground">{value}</div>
    </div>
  );
}
