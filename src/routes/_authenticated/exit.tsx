import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExitRequests, submitResignation, updateExitStatus, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DoorOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exit")({
  head: () => ({ meta: [{ title: "Exit Management — CollegeSera HRMS" }] }),
  component: ExitPage,
});

const STATUS = ["pending","accepted","clearance_in_progress","completed","revoked"];

function ExitPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: rows = [] } = useQuery({ queryKey: ["exits"], queryFn: () => useServerFn(listExitRequests)() });
  const doSubmit = useServerFn(submitResignation);
  const doUpdate = useServerFn(updateExitStatus);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ resignation_date: new Date().toISOString().slice(0, 10), last_working_date: "", reason: "" });

  const submit = useMutation({
    mutationFn: () => doSubmit({ data: form }),
    onSuccess: () => { toast.success("Submitted"); qc.invalidateQueries({ queryKey: ["exits"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: (p: { id: string; status: string; hr_note?: string }) => doUpdate({ data: p }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["exits"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const badge = (s: string) => s === "completed" ? "default" : s === "revoked" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Exit Management</h1>
          <p className="text-sm text-muted-foreground">Resignation and clearance workflow.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Submit resignation</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit resignation</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Resignation date</Label><Input type="date" value={form.resignation_date} onChange={(e) => setForm({ ...form, resignation_date: e.target.value })} /></div>
              <div><Label>Last working date</Label><Input type="date" value={form.last_working_date} onChange={(e) => setForm({ ...form, last_working_date: e.target.value })} /></div>
              <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => submit.mutate()}>Submit</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} requests</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><DoorOpen className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No exit requests</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Resignation</TableHead><TableHead>Last day</TableHead><TableHead>Status</TableHead>{isHr && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const row = r as { id: string; resignation_date: string; last_working_date?: string; status: string; employee?: { full_name: string } };
                  return (
                    <TableRow key={row.id}>
                      <TableCell>{row.employee?.full_name ?? "—"}</TableCell>
                      <TableCell>{row.resignation_date}</TableCell>
                      <TableCell>{row.last_working_date ?? "—"}</TableCell>
                      <TableCell><Badge variant={badge(row.status)}>{row.status.replace(/_/g," ")}</Badge></TableCell>
                      {isHr && (
                        <TableCell>
                          <Select value={row.status} onValueChange={(v) => update.mutate({ id: row.id, status: v })}>
                            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
                            <SelectContent>{STATUS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                      )}
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
