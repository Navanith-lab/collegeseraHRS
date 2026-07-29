import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPayrollRuns, runPayroll, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, CreditCard } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payroll/runs")({
  head: () => ({ meta: [{ title: "Payroll Runs — CollegeSera HRMS" }] }),
  component: RunsPage,
});

function RunsPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["payroll-runs"], queryFn: () => useServerFn(listPayrollRuns)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const doRun = useServerFn(runPayroll);
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });

  const run = useMutation({
    mutationFn: () => doRun({ data: form }),
    onSuccess: () => { toast.success("Payroll processed"); qc.invalidateQueries({ queryKey: ["payroll-runs"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Payroll Runs</h1>
          <p className="text-sm text-muted-foreground">Process monthly payroll and generate payslips.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Play className="mr-2 h-4 w-4" />Run payroll</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Process payroll</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Month</Label><Input type="number" min={1} max={12} value={form.month} onChange={(e) => setForm({ ...form, month: +e.target.value })} /></div>
                <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => run.mutate()} disabled={run.isPending}>{run.isPending ? "Processing…" : "Run"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><CreditCard className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No payroll runs yet</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Employees</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{String(r.month).padStart(2, "0")}/{r.year}</TableCell>
                    <TableCell>{r.total_employees}</TableCell>
                    <TableCell>₹{Number(r.total_gross).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₹{Number(r.total_net).toLocaleString()}</TableCell>
                    <TableCell><Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
