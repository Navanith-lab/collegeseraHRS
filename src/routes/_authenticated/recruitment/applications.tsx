import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApplications, updateApplicationStatus, listJobOpenings, createApplication, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ClipboardList } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruitment/applications")({
  head: () => ({ meta: [{ title: "Applications — CollegeSera HRMS" }] }),
  component: ApplicationsPage,
});

const STATUS = ["applied","shortlisted","interview_scheduled","selected","rejected","on_hold"];

function ApplicationsPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["applications"], queryFn: () => useServerFn(listApplications)() });
  const { data: jobs = [] } = useQuery({ queryKey: ["jobs"], queryFn: () => useServerFn(listJobOpenings)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const doCreate = useServerFn(createApplication);
  const doUpdate = useServerFn(updateApplicationStatus);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ job_id: "", applicant_name: "", applicant_email: "", applicant_phone: "", cover_letter: "" });

  const create = useMutation({
    mutationFn: () => doCreate({ data: form }),
    onSuccess: () => { toast.success("Application added"); qc.invalidateQueries({ queryKey: ["applications"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const setStatus = useMutation({
    mutationFn: (p: { id: string; status: string }) => doUpdate({ data: p }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applications"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const badge = (s: string) => s === "selected" ? "default" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Applications</h1>
          <p className="text-sm text-muted-foreground">Track candidates through the hiring pipeline.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add candidate</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New application</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Job</Label>
                  <Select value={form.job_id} onValueChange={(v) => setForm({ ...form, job_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Name</Label><Input value={form.applicant_name} onChange={(e) => setForm({ ...form, applicant_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.applicant_email} onChange={(e) => setForm({ ...form, applicant_email: e.target.value })} /></div>
                <div><Label>Phone</Label><Input value={form.applicant_phone} onChange={(e) => setForm({ ...form, applicant_phone: e.target.value })} /></div>
                <div><Label>Cover letter</Label><Textarea value={form.cover_letter} onChange={(e) => setForm({ ...form, cover_letter: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.job_id || !form.applicant_name || !form.applicant_email}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} applications</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><ClipboardList className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No applications yet</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Candidate</TableHead><TableHead>Job</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const row = r as { id: string; applicant_name: string; applicant_email: string; status: string; job?: { title: string } };
                  return (
                    <TableRow key={row.id}>
                      <TableCell><div className="text-sm font-medium">{row.applicant_name}</div><div className="text-xs text-muted-foreground">{row.applicant_email}</div></TableCell>
                      <TableCell>{row.job?.title ?? "—"}</TableCell>
                      <TableCell><Badge variant={badge(row.status)}>{row.status.replace(/_/g," ")}</Badge></TableCell>
                      {canManage && (
                        <TableCell>
                          <Select value={row.status} onValueChange={(v) => setStatus.mutate({ id: row.id, status: v })}>
                            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
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
