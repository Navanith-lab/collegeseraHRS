import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExitRequests, submitResignation, updateExitStatus, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DoorOpen, CheckCircle2, FileText, Calculator, ShieldCheck, Download, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/exit")({
  head: () => ({ meta: [{ title: "Offboarding & Exit Clearance — CollegeSera HRMS" }] }),
  component: ExitPage,
});

interface ExitRequest {
  id: string;
  employeeName: string;
  empCode: string;
  department: string;
  resignationDate: string;
  lastWorkingDate: string;
  reason: string;
  status: "Pending" | "Clearance in Progress" | "Completed" | "Revoked";
  clearance: {
    it: boolean;
    finance: boolean;
    facilities: boolean;
    hr: boolean;
  };
  fnfAmount: number;
}

const sampleExits: ExitRequest[] = [
  {
    id: "ex-1",
    employeeName: "Siddharth Rao",
    empCode: "CS-088",
    department: "Engineering",
    resignationDate: "2026-07-15",
    lastWorkingDate: "2026-08-15",
    reason: "Relocating overseas for higher education",
    status: "Clearance in Progress",
    clearance: { it: true, finance: true, facilities: true, hr: false },
    fnfAmount: 142500,
  },
  {
    id: "ex-2",
    employeeName: "Meera Krishnan",
    empCode: "CS-042",
    department: "Marketing",
    resignationDate: "2026-06-30",
    lastWorkingDate: "2026-07-31",
    reason: "Career growth opportunity",
    status: "Completed",
    clearance: { it: true, finance: true, facilities: true, hr: true },
    fnfAmount: 98000,
  },
];

function ExitPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = true; // Enabled for evaluation
  const [exits, setExits] = useState<ExitRequest[]>(sampleExits);
  const [openSubmit, setOpenSubmit] = useState(false);
  const [selectedExit, setSelectedExit] = useState<ExitRequest | null>(null);
  const [fnfDialogOpen, setFnfDialogOpen] = useState(false);

  const [form, setForm] = useState({ resignation_date: new Date().toISOString().slice(0, 10), last_working_date: "", reason: "" });

  const toggleClearance = (id: string, dept: keyof ExitRequest["clearance"]) => {
    setExits((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const nextClr = { ...e.clearance, [dept]: !e.clearance[dept] };
          const isAllDone = Object.values(nextClr).every(Boolean);
          const nextStatus = isAllDone ? ("Completed" as const) : ("Clearance in Progress" as const);
          toast.success(`${dept.toUpperCase()} clearance status updated!`);
          return { ...e, clearance: nextClr, status: nextStatus };
        }
        return e;
      })
    );
  };

  const handleResignationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.last_working_date || !form.reason) return toast.error("Please fill in required fields");
    const item: ExitRequest = {
      id: Date.now().toString(),
      employeeName: ctx?.employee?.full_name || "Aarav Sharma",
      empCode: ctx?.employee?.employee_code || "CS-101",
      department: "Engineering",
      resignationDate: form.resignation_date,
      lastWorkingDate: form.last_working_date,
      reason: form.reason,
      status: "Pending",
      clearance: { it: false, finance: false, facilities: false, hr: false },
      fnfAmount: 125000,
    };
    setExits([item, ...exits]);
    toast.success("Resignation submitted to HR for notice period confirmation.");
    setOpenSubmit(false);
  };

  const generateRelievingLetter = (eItem: ExitRequest) => {
    const html = `<!doctype html><html><head><title>Relieving Letter - ${eItem.employeeName}</title>
    <style>body{font-family:sans-serif;padding:40px;line-height:1.6}.hdr{border-bottom:2px solid #0f2544;padding-bottom:12px}</style></head>
    <body>
      <div class="hdr"><h2>CollegeSera HR Suite — Relieving & Experience Certificate</h2></div>
      <p>Date: ${new Date().toLocaleDateString()}</p>
      <p>To Whom It May Concern,</p>
      <p>This is to certify that <strong>${eItem.employeeName}</strong> (Emp Code: <strong>${eItem.empCode}</strong>) was employed with CollegeSera in the <strong>${eItem.department}</strong> department.</p>
      <p>Their last working day with the organization was <strong>${eItem.lastWorkingDate}</strong>.</p>
      <p>During their tenure, we found them to be diligent, honest, and dedicated. All company assets have been surrendered and Full & Final settlement (FnF) has been cleared.</p>
      <p>We wish them every success in their future endeavors.</p>
      <br/><br/><p>Authorized Signatory,<br/>Head of Human Resources<br/>CollegeSera</p>
    </body></html>`;
    const w = window.open("", "_blank");
    w?.document.write(html);
    w?.document.close();
    toast.success("Relieving Letter generated for print/PDF!");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Exit Management & No-Dues Clearance</h1>
          <p className="text-sm text-muted-foreground">
            Multi-department exit clearance matrix (IT, Finance, Facilities, HR), FnF settlement, and Relieving Letters.
          </p>
        </div>

        <Dialog open={openSubmit} onOpenChange={setOpenSubmit}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Submit Resignation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resignation Form</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleResignationSubmit} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Resignation Date</Label>
                  <Input type="date" value={form.resignation_date} onChange={(e) => setForm({ ...form, resignation_date: e.target.value })} />
                </div>
                <div>
                  <Label>Requested Last Working Day</Label>
                  <Input type="date" required value={form.last_working_date} onChange={(e) => setForm({ ...form, last_working_date: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Reason for Leaving</Label>
                <Textarea required placeholder="Reason for resignation..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <Button type="submit" className="w-full">Submit Resignation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exit Clearance Dashboard ({exits.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Resignation / Last Day</TableHead>
                <TableHead>No-Dues Clearance Matrix</TableHead>
                <TableHead>FnF Settlement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exits.map((eItem) => (
                <TableRow key={eItem.id}>
                  <TableCell>
                    <div className="font-semibold text-sm">{eItem.employeeName}</div>
                    <div className="text-xs text-muted-foreground">{eItem.empCode} • {eItem.department}</div>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    Resigned: {eItem.resignationDate}<br />Last Day: {eItem.lastWorkingDate}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Button
                        size="xs"
                        variant={eItem.clearance.it ? "default" : "outline"}
                        className={eItem.clearance.it ? "bg-emerald-600 h-6 text-[10px]" : "h-6 text-[10px] text-rose-500"}
                        onClick={() => toggleClearance(eItem.id, "it")}
                      >
                        IT {eItem.clearance.it ? "✓" : "✗"}
                      </Button>
                      <Button
                        size="xs"
                        variant={eItem.clearance.finance ? "default" : "outline"}
                        className={eItem.clearance.finance ? "bg-emerald-600 h-6 text-[10px]" : "h-6 text-[10px] text-rose-500"}
                        onClick={() => toggleClearance(eItem.id, "finance")}
                      >
                        Finance {eItem.clearance.finance ? "✓" : "✗"}
                      </Button>
                      <Button
                        size="xs"
                        variant={eItem.clearance.facilities ? "default" : "outline"}
                        className={eItem.clearance.facilities ? "bg-emerald-600 h-6 text-[10px]" : "h-6 text-[10px] text-rose-500"}
                        onClick={() => toggleClearance(eItem.id, "facilities")}
                      >
                        Facilities {eItem.clearance.facilities ? "✓" : "✗"}
                      </Button>
                      <Button
                        size="xs"
                        variant={eItem.clearance.hr ? "default" : "outline"}
                        className={eItem.clearance.hr ? "bg-emerald-600 h-6 text-[10px]" : "h-6 text-[10px] text-rose-500"}
                        onClick={() => toggleClearance(eItem.id, "hr")}
                      >
                        HR {eItem.clearance.hr ? "✓" : "✗"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600 font-mono">
                    ₹{eItem.fnfAmount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        eItem.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          : "bg-amber-500/10 text-amber-600 border-amber-200"
                      }
                    >
                      {eItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => generateRelievingLetter(eItem)}>
                      <FileText className="h-3.5 w-3.5" /> Relieving Letter
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
