import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  assignShift,
  createShift,
  getCurrentContext,
  listEmployees,
  listEmployeeShifts,
  listShifts,
} from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shifts")({
  head: () => ({ meta: [{ title: "Shifts — CollegeSera HRMS" }] }),
  component: ShiftsPage,
});

function ShiftsPage() {
  const qc = useQueryClient();
  const { data: shifts = [] } = useQuery({ queryKey: ["shifts"], queryFn: () => useServerFn(listShifts)() });
  const { data: assigns = [] } = useQuery({ queryKey: ["employee-shifts"], queryFn: () => useServerFn(listEmployeeShifts)() });
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: () => useServerFn(listEmployees)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");

  const doCreate = useServerFn(createShift);
  const doAssign = useServerFn(assignShift);

  const [openShift, setOpenShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "09:00", end_time: "18:00", grace_minutes: 15 });
  const [openAssign, setOpenAssign] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: "", shift_id: "", effective_from: new Date().toISOString().slice(0, 10) });

  const createM = useMutation({
    mutationFn: () => doCreate({ data: shiftForm }),
    onSuccess: () => { toast.success("Shift created"); qc.invalidateQueries({ queryKey: ["shifts"] }); setOpenShift(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const assignM = useMutation({
    mutationFn: () => doAssign({ data: assignForm }),
    onSuccess: () => { toast.success("Shift assigned"); qc.invalidateQueries({ queryKey: ["employee-shifts"] }); setOpenAssign(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Shifts</h1>
          <p className="text-sm text-muted-foreground">Define work schedules and assign them to employees.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={openShift} onOpenChange={setOpenShift}>
              <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />New shift</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create shift</DialogTitle></DialogHeader>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2"><Label>Name</Label><Input value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} /></div>
                  <div><Label>Start</Label><Input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} /></div>
                  <div><Label>Grace (min)</Label><Input type="number" value={shiftForm.grace_minutes} onChange={(e) => setShiftForm({ ...shiftForm, grace_minutes: +e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={() => createM.mutate()} disabled={!shiftForm.name}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={openAssign} onOpenChange={setOpenAssign}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Assign shift</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Assign shift</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Employee</Label>
                    <Select value={assignForm.employee_id} onValueChange={(v) => setAssignForm({ ...assignForm, employee_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Shift</Label>
                    <Select value={assignForm.shift_id} onValueChange={(v) => setAssignForm({ ...assignForm, shift_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{shifts.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Effective from</Label><Input type="date" value={assignForm.effective_from} onChange={(e) => setAssignForm({ ...assignForm, effective_from: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={() => assignM.mutate()} disabled={!assignForm.employee_id || !assignForm.shift_id}>Assign</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Shift templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {shifts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-sm text-muted-foreground"><Clock className="mb-2 h-8 w-8" />No shifts defined</div>
            ) : shifts.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.start_time} – {s.end_time}</div>
                </div>
                <Badge variant="secondary">{s.grace_minutes}m grace</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Assignments</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Shift</TableHead><TableHead>From</TableHead></TableRow></TableHeader>
              <TableBody>
                {assigns.length === 0 && <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">No assignments yet</TableCell></TableRow>}
                {assigns.map((a) => {
                  const row = a as { id: string; effective_from: string; employee?: { full_name: string }; shift?: { name: string } };
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.employee?.full_name ?? "—"}</TableCell>
                      <TableCell>{row.shift?.name ?? "—"}</TableCell>
                      <TableCell>{row.effective_from}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
