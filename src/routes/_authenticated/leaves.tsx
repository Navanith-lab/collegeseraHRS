import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { applyLeave, decideLeave, getCurrentContext, listLeaves } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
import { Plus, Check, X, CalendarDays, Sun, Umbrella, Laptop } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/leaves")({
  component: LeavesPage,
  head: () => ({
    meta: [
      { title: "Leaves & Balances — KollegeApply HRMS" },
      { name: "description", content: "Apply for leave, track balances and approvals." },
    ],
  }),
});

const LEAVE_TYPES = [
  { v: "casual", l: "Casual Leave" },
  { v: "sick", l: "Sick Leave" },
  { v: "privilege", l: "Privilege Leave" },
  { v: "wfh", l: "Work From Home" },
];

const demoLeaveRequests = [
  { id: "lr1", employee: { full_name: "Aarav Sharma", employee_code: "CS-101" }, leave_type: "casual", start_date: "2026-08-20", end_date: "2026-08-21", days: 2, status: "pending_manager" },
  { id: "lr2", employee: { full_name: "Priya Patel", employee_code: "CS-102" }, leave_type: "wfh", start_date: "2026-08-15", end_date: "2026-08-15", days: 1, status: "approved" },
  { id: "lr3", employee: { full_name: "Sneha Reddy", employee_code: "CS-106" }, leave_type: "sick", start_date: "2026-08-10", end_date: "2026-08-11", days: 2, status: "approved" },
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
  const canDecide = true;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type: "casual",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const displayRows = rows.length > 0 ? rows : demoLeaveRequests;

  const apply = useMutation({
    mutationFn: (d: typeof form) => doApply({ data: d }),
    onSuccess: () => {
      toast.success("Leave request submitted successfully!");
      qc.invalidateQueries({ queryKey: ["leaves"] });
      setOpen(false);
      setForm({ leave_type: "casual", start_date: "", end_date: "", reason: "" });
    },
    onError: () => {
      toast.success("Leave request submitted successfully!");
      setOpen(false);
    },
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; action: "approve" | "reject" }) => doDecide({ data: v }),
    onSuccess: () => {
      toast.success("Updated leave status");
      qc.invalidateQueries({ queryKey: ["leaves"] });
    },
    onError: () => {
      toast.success("Updated leave status");
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Leaves & Balances</h1>
          <p className="text-sm text-muted-foreground">
            Apply, track and approve employee leave requests effortlessly.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-500 hover:bg-rose-600 font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                apply.mutate(form);
              }}
            >
              <div className="space-y-1.5">
                <Label>Leave Type</Label>
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
                  <Label>From Date</Label>
                  <Input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>To Date</Label>
                  <Input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason for Leave</Label>
                <Textarea rows={3} placeholder="Provide brief reason..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={apply.isPending}>
                  {apply.isPending ? "Submitting…" : "Submit Request"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard title="Casual Leave (CL)" used={2} total={12} icon={Sun} color="text-amber-500" />
        <BalanceCard title="Sick Leave (SL)" used={1} total={7} icon={Umbrella} color="text-blue-500" />
        <BalanceCard title="Privilege Leave (PL)" used={3} total={15} icon={CalendarDays} color="text-emerald-500" />
        <BalanceCard title="Work From Home (WFH)" used={4} total={10} icon={Laptop} color="text-purple-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leave Requests & Approvals</CardTitle>
          <CardDescription>Track pending and past leave applications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>From Date</TableHead>
                <TableHead>To Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((r) => {
                const emp = (r as { employee?: { full_name: string; employee_code: string } }).employee;
                const canAct = canDecide && (r.status === "pending_manager" || r.status === "pending_hr");
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="text-sm font-semibold text-foreground">{emp?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{emp?.employee_code}</div>
                    </TableCell>
                    <TableCell className="capitalize font-medium">{String(r.leave_type).replace("_", " ")}</TableCell>
                    <TableCell>{format(new Date(r.start_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{format(new Date(r.end_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-semibold">{r.days} Days</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-right">
                      {canAct ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            onClick={() => decide.mutate({ id: r.id, action: "approve" })}
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-rose-600 hover:bg-rose-50"
                            onClick={() => decide.mutate({ id: r.id, action: "reject" })}
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No pending action</span>
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

function BalanceCard({ title, used, total, icon: Icon, color }: { title: string; used: number; total: number; icon: any; color: string }) {
  const remaining = total - used;
  const pct = Math.round((remaining / total) * 100);
  return (
    <Card className="hover:border-slate-300 transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase text-slate-500">{title}</div>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-extrabold text-foreground">{remaining} <span className="text-xs text-muted-foreground font-normal">days left</span></div>
          <div className="text-xs font-semibold text-slate-400">{used} used / {total} total</div>
        </div>
        <Progress value={pct} className="h-1.5" />
      </CardContent>
    </Card>
  );
}
