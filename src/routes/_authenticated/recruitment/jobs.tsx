import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listJobOpenings, createJobOpening, updateJobStatus, listDepartments, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruitment/jobs")({
  head: () => ({ meta: [{ title: "Job Openings — CollegeSera HRMS" }] }),
  component: JobsPage,
});

function JobsPage() {
  const qc = useQueryClient();
  const { data: jobs = [], isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => useServerFn(listJobOpenings)() });
  const { data: depts = [] } = useQuery({ queryKey: ["departments"], queryFn: () => useServerFn(listDepartments)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");

  const doCreate = useServerFn(createJobOpening);
  const doUpdate = useServerFn(updateJobStatus);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", department_id: "", designation: "", vacancies: 1, description: "", requirements: "", employment_type: "full_time", closing_date: "" });

  const create = useMutation({
    mutationFn: () => doCreate({ data: { ...form, department_id: form.department_id || null, closing_date: form.closing_date || null } }),
    onSuccess: () => { toast.success("Job posted"); qc.invalidateQueries({ queryKey: ["jobs"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (p: { id: string; status: string }) => doUpdate({ data: p }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusColor = (s: string) => s === "open" ? "default" : s === "closed" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Job Openings</h1>
          <p className="text-sm text-muted-foreground">Post and manage vacancies.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New job</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Post job opening</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Designation</Label><Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
                <div><Label>Vacancies</Label><Input type="number" value={form.vacancies} onChange={(e) => setForm({ ...form, vacancies: +e.target.value })} /></div>
                <div><Label>Department</Label>
                  <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Employment type</Label>
                  <Select value={form.employment_type} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["full_time","part_time","contract","intern"].map((t) => <SelectItem key={t} value={t}>{t.replace("_"," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2"><Label>Closing date</Label><Input type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Requirements</Label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.title}>Post</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading…</div> : jobs.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14"><Briefcase className="h-10 w-10 text-muted-foreground" /><div className="text-sm text-muted-foreground">No openings yet</div></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((j) => {
            const job = j as { id: string; title: string; designation?: string; vacancies: number; status: string; employment_type: string; description?: string; department?: { name: string } };
            return (
              <Card key={job.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{job.title}</CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">{job.department?.name ?? "—"} · {job.employment_type.replace("_"," ")} · {job.vacancies} vacancy</div>
                  </div>
                  <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                </CardHeader>
                {job.description && <CardContent><p className="line-clamp-3 text-sm text-muted-foreground">{job.description}</p></CardContent>}
                {canManage && (
                  <CardContent className="flex gap-2 pt-0">
                    {["open","on_hold","closed"].filter((s) => s !== job.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => setStatus.mutate({ id: job.id, status: s })}>Set {s.replace("_"," ")}</Button>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
