import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyGoals, listAllGoals, createGoal, rateGoal, listPerformanceCycles, createPerformanceCycle, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Target, CheckCircle2, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/performance/goals")({
  head: () => ({ meta: [{ title: "Weighted OKRs — CollegeSera HRMS" }] }),
  component: GoalsPage,
});

interface OKR {
  id: string;
  title: string;
  category: "Company Goal" | "Department Goal" | "Individual KRA";
  weightage: number;
  progress: number;
  keyResults: string[];
}

const sampleOKRs: OKR[] = [
  {
    id: "okr-1",
    title: "Enhance Product Architecture & Microservices Scale",
    category: "Department Goal",
    weightage: 40,
    progress: 75,
    keyResults: [
      "Migrate auth service to OAuth2 / Supabase JWT",
      "Achieve 99.9% API Uptime across production clusters",
      "Reduce average page load latency under 200ms",
    ],
  },
  {
    id: "okr-2",
    title: "Automate Payroll & Tax Compliance Engine",
    category: "Company Goal",
    weightage: 35,
    progress: 90,
    keyResults: [
      "Implement Indian statutory PF/ESI/PT/TDS tax regime calculator",
      "One-click bank transfer file exporter for direct deposits",
    ],
  },
  {
    id: "okr-3",
    title: "Improve Technical Documentation & Code Reviews",
    category: "Individual KRA",
    weightage: 25,
    progress: 60,
    keyResults: [
      "Conduct minimum 15 thorough peer code reviews per month",
      "Maintain 90%+ unit test code coverage across core modules",
    ],
  },
];

function GoalsPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = true;
  const [okrs, setOkrs] = useState<OKR[]>(sampleOKRs);
  const [openGoal, setOpenGoal] = useState(false);

  const [newGoal, setNewGoal] = useState({ title: "", category: "Individual KRA" as OKR["category"], weightage: 20, keyResults: "" });

  const handleSliderChange = (id: string, val: number) => {
    setOkrs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, progress: val } : o))
    );
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.title) return toast.error("Please enter goal title");
    const item: OKR = {
      id: Date.now().toString(),
      title: newGoal.title,
      category: newGoal.category,
      weightage: newGoal.weightage,
      progress: 0,
      keyResults: newGoal.keyResults ? newGoal.keyResults.split("\n") : ["Deliver target outcomes"],
    };
    setOkrs([item, ...okrs]);
    toast.success("New Weighted OKR created!");
    setOpenGoal(false);
    setNewGoal({ title: "", category: "Individual KRA", weightage: 20, keyResults: "" });
  };

  const totalProgress = Math.round(
    okrs.reduce((acc, curr) => acc + (curr.progress * curr.weightage) / 100, 0)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Objectives & Key Results (OKRs)</h1>
          <p className="text-sm text-muted-foreground">
            Track weighted company goals, department targets, and individual KRAs with live progress sliders.
          </p>
        </div>

        <Dialog open={openGoal} onOpenChange={setOpenGoal}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Weighted OKR</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Objective & KRA</DialogTitle></DialogHeader>
            <form onSubmit={handleAddGoal} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Objective Title</Label>
                <Input required placeholder="e.g. Upgrade Mobile App Experience" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newGoal.category} onValueChange={(val: any) => setNewGoal({ ...newGoal, category: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Company Goal">Company Goal</SelectItem>
                      <SelectItem value="Department Goal">Department Goal</SelectItem>
                      <SelectItem value="Individual KRA">Individual KRA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Weightage (%)</Label>
                  <Input type="number" value={newGoal.weightage} onChange={(e) => setNewGoal({ ...newGoal, weightage: +e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Key Results (one per line)</Label>
                <Textarea rows={3} placeholder="Key Result 1&#10;Key Result 2" value={newGoal.keyResults} onChange={(e) => setNewGoal({ ...newGoal, keyResults: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Create OKR</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Weighted Score Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/20 p-3 text-primary">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Weighted OKR Score</div>
              <div className="text-3xl font-extrabold text-foreground">{totalProgress}%</div>
            </div>
          </div>
          <div className="w-full md:w-64">
            <Progress value={totalProgress} className="h-3" />
            <p className="mt-1 text-right text-xs text-muted-foreground">Q3 Performance Target</p>
          </div>
        </CardContent>
      </Card>

      {/* OKR Cards */}
      <div className="space-y-4">
        {okrs.map((okr) => (
          <Card key={okr.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{okr.category}</Badge>
                    <span className="text-xs font-semibold text-muted-foreground">Weightage: {okr.weightage}%</span>
                  </div>
                  <CardTitle className="mt-1.5 text-lg font-bold text-foreground">{okr.title}</CardTitle>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{okr.progress}%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progress Slider</span>
                  <span>{okr.progress}% Completed</span>
                </div>
                <Slider
                  defaultValue={[okr.progress]}
                  max={100}
                  step={5}
                  onValueChange={(val) => handleSliderChange(okr.id, val[0])}
                />
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Key Results (KRAs)</div>
                <div className="space-y-1.5">
                  {okr.keyResults.map((kr, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-foreground/90">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{kr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
