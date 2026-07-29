import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmployeeSalaries, upsertEmployeeSalary, listEmployees, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Banknote } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/payroll/salary-structures")({
  head: () => ({ meta: [{ title: "Salary Structures — CollegeSera HRMS" }] }),
  component: SalaryPage,
});

function SalaryPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["employee-salaries"], queryFn: () => useServerFn(listEmployeeSalaries)() });
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: () => useServerFn(listEmployees)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const doSave = useServerFn(upsertEmployeeSalary);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: "", effective_date: new Date().toISOString().slice(0, 10), ctc: 0, basic: 0, hra: 0, da: 0, ta: 0, special_allowance: 0, professional_tax: 200, other_deductions: 0 });

  const save = useMutation({
    mutationFn: () => doSave({ data: form }),
    onSuccess: () => { toast.success("Salary saved"); qc.invalidateQueries({ queryKey: ["employee-salaries"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Salary Structures</h1>
          <p className="text-sm text-muted-foreground">Configure per-employee compensation.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add structure</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Salary structure</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Employee</Label>
                  <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name} · {e.employee_code}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Effective from</Label><Input type="date" value={form.effective_date} onChange={(e) => setForm({ ...form, effective_date: e.target.value })} /></div>
                <div><Label>CTC (annual)</Label><Input type="number" value={form.ctc} onChange={(e) => setForm({ ...form, ctc: +e.target.value })} /></div>
                <div><Label>Basic</Label><Input type="number" value={form.basic} onChange={(e) => setForm({ ...form, basic: +e.target.value })} /></div>
                <div><Label>HRA</Label><Input type="number" value={form.hra} onChange={(e) => setForm({ ...form, hra: +e.target.value })} /></div>
                <div><Label>DA</Label><Input type="number" value={form.da} onChange={(e) => setForm({ ...form, da: +e.target.value })} /></div>
                <div><Label>TA</Label><Input type="number" value={form.ta} onChange={(e) => setForm({ ...form, ta: +e.target.value })} /></div>
                <div><Label>Special allowance</Label><Input type="number" value={form.special_allowance} onChange={(e) => setForm({ ...form, special_allowance: +e.target.value })} /></div>
                <div><Label>Professional tax</Label><Input type="number" value={form.professional_tax} onChange={(e) => setForm({ ...form, professional_tax: +e.target.value })} /></div>
                <div><Label>Other deductions</Label><Input type="number" value={form.other_deductions} onChange={(e) => setForm({ ...form, other_deductions: +e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => save.mutate()} disabled={!form.employee_id}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Active structures</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-sm text-muted-foreground">Loading…</div> : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><Banknote className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No salary structures</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>From</TableHead><TableHead>Basic</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>CTC</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const row = r as { id: string; employee?: { full_name: string; employee_code: string }; effective_date: string; basic: number; gross: number; net: number; ctc: number };
                  return (
                    <TableRow key={row.id}>
                      <TableCell><div className="text-sm font-medium">{row.employee?.full_name}</div><div className="text-xs text-muted-foreground">{row.employee?.employee_code}</div></TableCell>
                      <TableCell>{row.effective_date}</TableCell>
                      <TableCell>₹{Number(row.basic).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(row.gross).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">₹{Number(row.net).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(row.ctc).toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
