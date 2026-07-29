import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLeaveBalances, getMyLeaveBalance, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/leave-balances")({
  head: () => ({ meta: [{ title: "Leave Balances — CollegeSera HRMS" }] }),
  component: LeaveBalancesPage,
});

const TYPES = [
  { key: "casual", label: "Casual" },
  { key: "sick", label: "Sick" },
  { key: "privilege", label: "Privilege" },
  { key: "wfh", label: "WFH" },
  { key: "comp_off", label: "Comp Off" },
] as const;

function LeaveBalancesPage() {
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const { data: mine } = useQuery({ queryKey: ["my-leave-balance"], queryFn: () => useServerFn(getMyLeaveBalance)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: all = [] } = useQuery({
    queryKey: ["leave-balances"],
    queryFn: () => useServerFn(listLeaveBalances)(),
    enabled: isHr,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leave Balances</h1>
        <p className="text-sm text-muted-foreground">Yearly leave entitlements and usage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TYPES.map((t) => {
          const total = Number((mine as Record<string, unknown>)?.[`${t.key}_total`] ?? 0);
          const used = Number((mine as Record<string, unknown>)?.[`${t.key}_used`] ?? 0);
          const pct = total > 0 ? (used / total) * 100 : 0;
          return (
            <Card key={t.key}>
              <CardHeader className="pb-2"><CardTitle className="text-sm">{t.label}</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.max(0, total - used)}<span className="text-sm font-normal text-muted-foreground"> / {total}</span></div>
                <Progress className="mt-2 h-1.5" value={pct} />
                <div className="mt-1 text-xs text-muted-foreground">{used} used</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isHr && (
        <Card>
          <CardHeader><CardTitle className="text-base">All employees</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead>{TYPES.map((t) => <TableHead key={t.key}>{t.label}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {all.length === 0 && <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No balances configured</TableCell></TableRow>}
                {all.map((r) => {
                  const row = r as Record<string, unknown> & { id: string; employee?: { full_name: string; employee_code: string } };
                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{row.employee?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{row.employee?.employee_code}</div>
                      </TableCell>
                      {TYPES.map((t) => (
                        <TableCell key={t.key}>
                          {Number(row[`${t.key}_used`] ?? 0)} / {Number(row[`${t.key}_total`] ?? 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
