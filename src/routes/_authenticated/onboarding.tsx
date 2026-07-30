import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Circle, Clock, Laptop, ShieldCheck, UserCheck, FileText, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

interface OnboardingTask {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  startDate: string;
  category: "IT Setup" | "HR & Docs" | "Finance & Bank" | "Orientation";
  taskName: string;
  assignedTo: string;
  status: "completed" | "in_progress" | "pending";
}

const initialTasks: OnboardingTask[] = [
  { id: "1", employeeName: "Aarav Sharma", role: "Frontend Developer", department: "Engineering", startDate: "2026-08-01", category: "IT Setup", taskName: "Provision MacBook Pro & Setup Work Email", assignedTo: "IT Desk", status: "completed" },
  { id: "2", employeeName: "Aarav Sharma", role: "Frontend Developer", department: "Engineering", startDate: "2026-08-01", category: "HR & Docs", taskName: "Collect Identity & Academic Certificates", assignedTo: "HR Operations", status: "in_progress" },
  { id: "3", employeeName: "Aarav Sharma", role: "Frontend Developer", department: "Engineering", startDate: "2026-08-01", category: "Finance & Bank", taskName: "Collect Salary Account & PF Details", assignedTo: "Payroll Team", status: "pending" },
  { id: "4", employeeName: "Priya Patel", role: "Product Manager", department: "Product", startDate: "2026-08-05", category: "IT Setup", taskName: "Jira & Slack Workspace Access", assignedTo: "IT Desk", status: "in_progress" },
  { id: "5", employeeName: "Priya Patel", role: "Product Manager", department: "Product", startDate: "2026-08-05", category: "Orientation", taskName: "Welcome Session & Team Introduction", assignedTo: "Engineering Manager", status: "pending" },
  { id: "6", employeeName: "Rohan Verma", role: "UX Designer", department: "Design", startDate: "2026-08-10", category: "HR & Docs", taskName: "Sign NDA & Employment Agreement", assignedTo: "Legal HR", status: "completed" },
];

function OnboardingPage() {
  const [tasks, setTasks] = useState<OnboardingTask[]>(initialTasks);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    employeeName: "",
    role: "",
    department: "Engineering",
    startDate: "",
    category: "IT Setup" as OnboardingTask["category"],
    taskName: "",
    assignedTo: "",
  });

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus =
            t.status === "pending"
              ? "in_progress"
              : t.status === "in_progress"
              ? "completed"
              : "pending";
          toast.success(`Task status updated to ${nextStatus.replace("_", " ")}`);
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.employeeName || !newTask.taskName) return toast.error("Please fill in required fields");
    const item: OnboardingTask = {
      id: Date.now().toString(),
      ...newTask,
      status: "pending",
    };
    setTasks([item, ...tasks]);
    toast.success("New onboarding task created!");
    setIsDialogOpen(false);
    setNewTask({
      employeeName: "",
      role: "",
      department: "Engineering",
      startDate: "",
      category: "IT Setup",
      taskName: "",
      assignedTo: "",
    });
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Onboarding Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Manage pre-onboarding checklists, hardware provisioning, document collection, and orientation.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Onboarding Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Onboarding Checklist Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>New Joiner Name</Label>
                <Input
                  required
                  placeholder="e.g. Rahul Kapoor"
                  value={newTask.employeeName}
                  onChange={(e) => setNewTask({ ...newTask, employeeName: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    placeholder="e.g. Backend Dev"
                    value={newTask.role}
                    onChange={(e) => setNewTask({ ...newTask, role: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={newTask.department}
                    onValueChange={(val) => setNewTask({ ...newTask, department: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newTask.category}
                    onValueChange={(val: any) => setNewTask({ ...newTask, category: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT Setup">IT Setup</SelectItem>
                      <SelectItem value="HR & Docs">HR & Docs</SelectItem>
                      <SelectItem value="Finance & Bank">Finance & Bank</SelectItem>
                      <SelectItem value="Orientation">Orientation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  <Input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Task Title</Label>
                <Input
                  required
                  placeholder="e.g. Laptop Allocation & VPN Config"
                  value={newTask.taskName}
                  onChange={(e) => setNewTask({ ...newTask, taskName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Owner</Label>
                <Input
                  placeholder="e.g. IT Helpdesk"
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Create Task</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercent}%</div>
            <Progress value={progressPercent} className="mt-2 h-2" />
            <p className="mt-1 text-xs text-muted-foreground">{completedCount} of {tasks.length} tasks completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IT Hardware & Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Laptop className="h-5 w-5 text-blue-500" />
              {tasks.filter((t) => t.category === "IT Setup" && t.status === "completed").length} /{" "}
              {tasks.filter((t) => t.category === "IT Setup").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Laptops & software credentials</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Document Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <FileText className="h-5 w-5 text-amber-500" />
              {tasks.filter((t) => t.category === "HR & Docs" && t.status === "completed").length} /{" "}
              {tasks.filter((t) => t.category === "HR & Docs").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">ID proof, NDA & background check</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bank & Payroll Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              {tasks.filter((t) => t.category === "Finance & Bank" && t.status === "completed").length} /{" "}
              {tasks.filter((t) => t.category === "Finance & Bank").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Direct deposit & PF accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Filter & List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Onboarding Checklists</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search joiner or task..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="IT Setup">IT Setup</SelectItem>
                  <SelectItem value="HR & Docs">HR & Docs</SelectItem>
                  <SelectItem value="Finance & Bank">Finance & Bank</SelectItem>
                  <SelectItem value="Orientation">Orientation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {filteredTasks.map((t) => (
              <div key={t.id} className="flex flex-col gap-4 p-4 hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <button onClick={() => toggleTaskStatus(t.id)} className="mt-1 transition-transform hover:scale-110">
                    {t.status === "completed" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-100" />
                    ) : t.status === "in_progress" ? (
                      <Clock className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <h4 className={`font-semibold ${t.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {t.taskName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Joiner: <span className="font-medium text-foreground">{t.employeeName}</span> ({t.role} - {t.department}) • Joining: {t.startDate}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <Badge variant="outline">{t.category}</Badge>
                  <span className="text-xs text-muted-foreground">Owner: {t.assignedTo}</span>
                  <Badge
                    className={
                      t.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200"
                        : t.status === "in_progress"
                        ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }
                  >
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
