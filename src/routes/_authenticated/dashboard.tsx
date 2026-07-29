import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentContext, getDashboardStats, checkIn, checkOut } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, CalendarDays, Bell, LogIn, LogOut, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard — CollegeSera HRMS" },
      { name: "description", content: "Your CollegeSera HRMS overview." },
    ],
  }),
});

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
      toast.success(action === "in" ? "Checked in" : "Checked out");
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const today = stats?.todayAttendance;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, {ctx?.profile?.full_name || ctx?.profile?.email || "there"} 👋
          </h1>
          <Badge variant="secondary" className="mt-2">
            {primaryRole}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleCheck("in")} disabled={!!today?.check_in}>
            <LogIn className="mr-2 h-4 w-4" />
            {today?.check_in ? "Checked in" : "Check in"}
          </Button>
          <Button variant="outline" onClick={() => handleCheck("out")} disabled={!today?.check_in || !!today?.check_out}>
            <LogOut className="mr-2 h-4 w-4" />
            {today?.check_out ? "Checked out" : "Check out"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={stats?.totalEmployees ?? 0} icon={Users} loading={isLoading} />
        <StatCard label="Departments" value={stats?.totalDepartments ?? 0} icon={Building2} loading={isLoading} />
        <StatCard label="Pending approvals" value={stats?.pendingApprovals ?? 0} icon={Clock} loading={isLoading} accent />
        <StatCard label="My leaves this year" value={stats?.leaveCount ?? 0} icon={CalendarDays} loading={isLoading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {today ? (
              <div className="grid grid-cols-2 gap-4">
                <Metric label="Check-in" value={today.check_in ? format(new Date(today.check_in), "hh:mm a") : "—"} />
                <Metric label="Check-out" value={today.check_out ? format(new Date(today.check_out), "hh:mm a") : "—"} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No entry yet for today. Check in to start your day.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.announcements ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
            {stats?.announcements?.map((a) => (
              <div key={a.id} className="border-l-2 border-accent pl-3">
                <div className="text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground line-clamp-2">{a.body}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming holidays</CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.upcomingHolidays ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming holidays.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stats?.upcomingHolidays?.map((h) => (
                <div key={h.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex h-10 w-12 flex-col items-center justify-center rounded bg-accent/10 text-accent">
                    <span className="text-[10px] uppercase">{format(new Date(h.date), "MMM")}</span>
                    <span className="text-lg font-bold leading-none">{format(new Date(h.date), "d")}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{h.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${
            accent ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{loading ? "…" : value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}
