import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — CollegeSera HRMS" }] }),
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage departments, holidays, leave policies and company information.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { t: "Departments", d: "Configure the department structure." },
          { t: "Designations", d: "Job titles and grades." },
          { t: "Leave Policies", d: "Accrual rates and caps per leave type." },
          { t: "Payroll Components", d: "Earnings and deductions." },
          { t: "Working Hours", d: "Shift and workweek configuration." },
          { t: "Company Information", d: "Legal entity and branding." },
        ].map((s) => (
          <Card key={s.t}>
            <CardHeader>
              <CardTitle className="text-base">{s.t}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{s.d}</CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Configuration UIs are stubbed for this milestone — the underlying tables are live and can be
        wired next.
      </p>
    </div>
  );
}
