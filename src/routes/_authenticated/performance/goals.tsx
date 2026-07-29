import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyGoals, listAllGoals, createGoal, rateGoal, listPerformanceCycles, createPerformanceCycle, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/performance/goals")({
  head: () => ({ meta: [{ title: "Goals — CollegeSera HRMS" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: mine = [] } = useQuery({ queryKey: ["my-goals"], queryFn: () => useServerFn(listMyGoals)() });
  const { data: all = [] } = useQuery({ queryKey: ["all-goals"], queryFn: () => useServerFn(listAllGoals)(), enabled: isHr });
  const { data: cycles = [] } = useQuery({ queryKey: ["cycles"], queryFn: () => useServerFn(listPerformanceCycles)() });
  const doCreate = useServerFn(createGoal);
  const doRate = useServerFn(rateGoal);
  const doCycle = useServerFn(createPerformanceCycle);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ cycle_id: "", title: "", description: "", weightage: 20 });
  const [openCycle, setOpenCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name: "", start_date: "", end_date: "" });

  const create = useMutation({
    mutationFn: () => doCreate({ data: { ...form, employee_id: ctx?.employee?.id ?? "" } }),
    onSuccess: () => { toast.success("Goal added"); qc.invalidateQueries({ queryKey: ["my-goals"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cycleCreate = useMutation({
    mutationFn: () => doCycle({ data: cycleForm }),
    onSuccess: () => { toast.success("Cycle created"); qc.invalidateQueries({ queryKey: ["cycles"] }); setOpenCycle(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rate = useMutation({
    mutationFn: (p: { id: string; self_rating?: number; manager_rating?: number; self_comments?: string; manager_comments?: string }) => doRate({ data: p }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["my-goals"] }); qc.invalidateQueries({ queryKey: ["all-goals"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = isHr ? all : mine;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Goals & KRAs</h1>
          <p className="text-sm text-muted-foreground">Set objectives and track performance ratings.</p>
        </div>
        <div className="flex gap-2">
          {isHr && (
            <Dialog open={openCycle} onOpenChange={setOpenCycle}>
              <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />New cycle</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Performance cycle</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div><Label>Name</Label><Input value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} /></div>
                  <div><Label>Start</Label><Input type="date" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} /></div>
                  <div><Label>End</Label><Input type="date" value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} /></div>
                </div>
                <DialogFooter><Button onClick={() => cycleCreate.mutate()}>Create</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button disabled={!ctx?.employee?.id}><Plus className="mr-2 h-4 w-4" />Add goal</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add goal</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div><Label>Cycle</Label>
                  <Select value={form.cycle_id} onValueChange={(v) => setForm({ ...form, cycle_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{cycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Weightage (%)</Label><Input type="number" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: +e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.title || !form.cycle_id}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14"><Target className="h-10 w-10 text-muted-foreground" /><div className="text-sm text-muted-foreground">No goals yet</div></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((g) => {
            const goal = g as { id: string; title: string; description?: string; weightage: number; status: string; self_rating?: number; manager_rating?: number };
            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div><CardTitle className="text-base">{goal.title}</CardTitle><div className="mt-1 text-xs text-muted-foreground">Weight: {goal.weightage}%</div></div>
                  <Badge variant="secondary">{goal.status.replace("_"," ")}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Label className="text-xs">Self rating</Label>
                      <Input type="number" min={1} max={5} defaultValue={goal.self_rating ?? ""} onBlur={(e) => e.target.value && rate.mutate({ id: goal.id, self_rating: +e.target.value })} />
                    </div>
                    {isHr && (
                      <div><Label className="text-xs">Manager rating</Label>
                        <Input type="number" min={1} max={5} defaultValue={goal.manager_rating ?? ""} onBlur={(e) => e.target.value && rate.mutate({ id: goal.id, manager_rating: +e.target.value })} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
