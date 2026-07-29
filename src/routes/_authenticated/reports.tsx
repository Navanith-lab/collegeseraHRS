import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAnalyticsData } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — CollegeSera HRMS" }] }),
  component: ReportsPage,
});

const COLORS = ["#1E4E8C", "#F58220", "#10B981", "#EF4444", "#8B5CF6", "#F59E0B", "#06B6D4"];

function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["analytics"], queryFn: () => useServerFn(getAnalyticsData)() });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading analytics…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Company-wide HR metrics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Total employees" value={data.totalEmployees} />
        <KPI label="Active" value={data.activeEmployees} />
        <KPI label="Departments" value={data.totalDepartments} />
        <KPI label="Open jobs" value={data.openJobs} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Headcount by department</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.deptCounts} dataKey="count" nameKey="name" outerRadius={100} label>
                  {data.deptCounts.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Employment type</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.empByType}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="type" /><YAxis /><Tooltip />
                <Bar dataKey="count" fill="#1E4E8C" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Leaves this month</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={data.leaveByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis type="number" /><YAxis dataKey="type" type="category" width={90} /><Tooltip />
                <Bar dataKey="days" fill="#F58220" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Payroll trend</CardTitle></CardHeader>
          <CardContent style={{ height: 320 }}>
            <ResponsiveContainer>
              <LineChart data={data.payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="label" /><YAxis /><Tooltip /><Legend />
                <Line type="monotone" dataKey="gross" stroke="#1E4E8C" strokeWidth={2} />
                <Line type="monotone" dataKey="net" stroke="#F58220" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
