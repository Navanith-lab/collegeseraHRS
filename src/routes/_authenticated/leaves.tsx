import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { applyLeave, decideLeave, getCurrentContext, listLeaves } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check, X } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/leaves")({
  component: LeavesPage,
  head: () => ({
    meta: [
      { title: "Leaves — CollegeSera HRMS" },
      { name: "description", content: "Apply for leave, track balances and approvals." },
    ],
  }),
});

const LEAVE_TYPES = [
  { v: "casual", l: "Casual Leave" },
  { v: "sick", l: "Sick Leave" },
  { v: "privilege", l: "Privilege Leave" },
  { v: "wfh", l: "Work From Home" },
  { v: "on_duty", l: "On Duty" },
  { v: "half_day", l: "Half Day" },
  { v: "comp_off", l: "Comp Off" },
];

function statusBadge(status: string) {
  const map: Record<string, { v: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending_manager: { v: "secondary", label: "Pending Manager" },
    pending_hr: { v: "secondary", label: "Pending HR" },
    approved: { v: "default", label: "Approved" },
    rejected: { v: "destructive", label: "Rejected" },
    cancelled: { v: "outline", label: "Cancelled" },
  };
  const s = map[status] ?? { v: "outline" as const, label: status };
  return <Badge variant={s.v}>{s.label}</Badge>;
}

function LeavesPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listLeaves);
  const fetchCtx = useServerFn(getCurrentContext);
  const doApply = useServerFn(applyLeave);
  const doDecide = useServerFn(decideLeave);

  const { data: rows = [] } = useQuery({ queryKey: ["leaves"], queryFn: () => fetchList() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => fetchCtx() });
  const canDecide = !!ctx?.roles?.some((r) => r === "manager" || r === "hr_admin" || r === "super_admin");
  const myEmpId = ctx?.employee?.id;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const apply = useMutation({
    mutationFn: (d: typeof form) => doApply({ data: d }),
    onSuccess: () => {
      toast.success("Leave request submitted");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      setOpen(false);
      setForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" }) => doDecide({ data: v }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leaves</h1>
          <p className="text-sm text-muted-foreground">
            Apply, track and approve leaves through the standard flow.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={!myEmpId}>
              <Plus className="mr-2 h-4 w-4" /> Apply for leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for leave</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                apply.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((t) => (
                      <SelectItem key={t.v} value={t.v}>
                        {t.l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>From</Label>
                  <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>To</Label>
                  <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={apply.isPending}>
                  {apply.isPending ? "Submitting…" : "Submit"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!myEmpId && (
        <Card>
          <CardContent className="py-4 text-sm text-muted-foreground">
            Your account isn't linked to an employee record yet. Ask HR to create one so you can apply
            for leave.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Leave requests</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    No leave requests yet.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => {
                const emp = (r as { employee?: { full_name: string; employee_code: string } }).employee;
                const canAct =
                  canDecide && (r.status === "pending_manager" || r.status === "pending_hr");
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="text-sm font-medium">{emp?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{emp?.employee_code}</div>
                    </TableCell>
                    <TableCell className="capitalize">{String(r.leave_type).replace("_", " ")}</TableCell>
                    <TableCell>{format(new Date(r.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(r.end_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{r.days}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      {canAct && (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decide.mutate({ id: r.id, action: "approve" })}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => decide.mutate({ id: r.id, action: "reject" })}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
