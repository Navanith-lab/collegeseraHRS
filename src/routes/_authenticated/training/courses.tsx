import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTrainingCourses, createTrainingCourse, enrollInCourse, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/training/courses")({
  head: () => ({ meta: [{ title: "Training Courses — CollegeSera HRMS" }] }),
  component: CoursesPage,
});

function CoursesPage() {
  const qc = useQueryClient();
  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: () => useServerFn(listTrainingCourses)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const doCreate = useServerFn(createTrainingCourse);
  const doEnroll = useServerFn(enrollInCourse);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", trainer: "", category: "", mode: "online", duration_hours: 2, max_seats: 30 });

  const create = useMutation({
    mutationFn: () => doCreate({ data: form }),
    onSuccess: () => { toast.success("Course created"); qc.invalidateQueries({ queryKey: ["courses"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const enroll = useMutation({
    mutationFn: (id: string) => doEnroll({ data: { course_id: id } }),
    onSuccess: () => { toast.success("Enrolled"); qc.invalidateQueries({ queryKey: ["my-enrollments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Training Courses</h1>
          <p className="text-sm text-muted-foreground">Learning catalogue for employee development.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New course</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>Create course</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Trainer</Label><Input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Mode</Label>
                  <Select value={form.mode} onValueChange={(v) => setForm({ ...form, mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["online","offline","hybrid"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Duration (hrs)</Label><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: +e.target.value })} /></div>
                <div className="sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.title}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {courses.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14"><BookOpen className="h-10 w-10 text-muted-foreground" /><div className="text-sm text-muted-foreground">No courses available</div></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardHeader><CardTitle className="text-base">{c.title}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-1 text-xs">
                  {c.category && <Badge variant="outline">{c.category}</Badge>}
                  <Badge variant="secondary">{c.mode}</Badge>
                  {c.duration_hours && <Badge variant="outline">{c.duration_hours}h</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {c.description && <p className="line-clamp-3 text-sm text-muted-foreground">{c.description}</p>}
                {c.trainer && <div className="text-xs text-muted-foreground">Trainer: {c.trainer}</div>}
                <Button size="sm" className="w-full" onClick={() => enroll.mutate(c.id)}>Enroll</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
