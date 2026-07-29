import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAllGoals, listPerformanceCycles } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/performance/appraisals")({
  head: () => ({ meta: [{ title: "Appraisals — CollegeSera HRMS" }] }),
  component: AppraisalsPage,
});

function AppraisalsPage() {
  const { data: goals = [] } = useQuery({ queryKey: ["all-goals"], queryFn: () => useServerFn(listAllGoals)() });
  const { data: cycles = [] } = useQuery({ queryKey: ["cycles"], queryFn: () => useServerFn(listPerformanceCycles)() });

  const byEmp = new Map<string, { name: string; self: number[]; mgr: number[] }>();
  goals.forEach((g) => {
    const row = g as unknown as { employee_id: string; self_rating?: number; manager_rating?: number; employee?: { full_name: string } };
    const empId = row.employee_id;
    if (!row.employee || !empId) return;
    if (!byEmp.has(empId)) byEmp.set(empId, { name: row.employee.full_name, self: [], mgr: [] });
    const eRow = byEmp.get(empId)!;
    if (row.self_rating) eRow.self.push(row.self_rating);
    if (row.manager_rating) eRow.mgr.push(row.manager_rating);
  });

  const avg = (arr: number[]) => arr.length ? (arr.reduce((s, n) => s + n, 0) / arr.length).toFixed(2) : "—";
  const rows = Array.from(byEmp.entries()).map(([id, v]) => ({ id, name: v.name, selfAvg: avg(v.self), mgrAvg: avg(v.mgr) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Appraisals</h1>
        <p className="text-sm text-muted-foreground">Aggregate performance across active cycles ({cycles.length}).</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><Star className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No ratings recorded</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Self Avg</TableHead><TableHead>Manager Avg</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.selfAvg}</TableCell><TableCell>{r.mgrAvg}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
