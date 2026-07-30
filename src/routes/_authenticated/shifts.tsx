import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { assignShift, createShift, getCurrentContext, listEmployees, listEmployeeShifts, listShifts } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock, CalendarDays, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/shifts")({
  head: () => ({ meta: [{ title: "Roster & Shift Scheduler — CollegeSera HRMS" }] }),
  component: ShiftsPage,
});

interface RosterEntry {
  empName: string;
  role: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

const sampleRoster: RosterEntry[] = [
  { empName: "Aarav Sharma", role: "Dev Lead", mon: "General (9-6)", tue: "General (9-6)", wed: "General (9-6)", thu: "General (9-6)", fri: "General (9-6)", sat: "OFF", sun: "OFF" },
  { empName: "Vikram Malhotra", role: "DevOps", mon: "Night (10-7)", tue: "Night (10-7)", wed: "Night (10-7)", thu: "Night (10-7)", fri: "Night (10-7)", sat: "OFF", sun: "OFF" },
  { empName: "Priya Patel", role: "Product", mon: "General (9-6)", tue: "General (9-6)", wed: "General (9-6)", thu: "General (9-6)", fri: "General (9-6)", sat: "OFF", sun: "OFF" },
  { empName: "Karan Mehta", role: "Support", mon: "Morning (7-4)", tue: "Morning (7-4)", wed: "Morning (7-4)", thu: "Morning (7-4)", fri: "Morning (7-4)", sat: "General (9-6)", sun: "OFF" },
];

function ShiftsPage() {
  const qc = useQueryClient();
  const { data: shifts = [] } = useQuery({ queryKey: ["shifts"], queryFn: () => useServerFn(listShifts)() });
  const { data: assigns = [] } = useQuery({ queryKey: ["employee-shifts"], queryFn: () => useServerFn(listEmployeeShifts)() });
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: () => useServerFn(listEmployees)() });
  const canManage = true;

  const [roster, setRoster] = useState<RosterEntry[]>(sampleRoster);
  const [openShift, setOpenShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({ name: "", start_time: "09:00", end_time: "18:00", grace_minutes: 15 });

  const handleSwapRequest = (empName: string) => {
    toast.success(`Shift swap request created for ${empName}! Sent for Manager approval.`);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Multi-Shift Roster & Schedule Engine</h1>
          <p className="text-sm text-muted-foreground">
            Manage 24/7 rotating rosters, grace periods, night shifts, and shift swap requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={openShift} onOpenChange={setOpenShift}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Create Shift Template</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Shift Policy</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Shift template created!"); setOpenShift(false); }} className="space-y-4 pt-2">
                <div><Label>Shift Name</Label><Input required placeholder="e.g. Night Shift B" value={shiftForm.name} onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Start Time</Label><Input type="time" value={shiftForm.start_time} onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })} /></div>
                  <div><Label>End Time</Label><Input type="time" value={shiftForm.end_time} onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })} /></div>
                </div>
                <div><Label>Grace Period (minutes)</Label><Input type="number" value={shiftForm.grace_minutes} onChange={(e) => setShiftForm({ ...shiftForm, grace_minutes: +e.target.value })} /></div>
                <Button type="submit" className="w-full">Create Shift</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster" className="gap-2"><CalendarDays className="h-4 w-4" /> Weekly Roster Grid</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><Clock className="h-4 w-4" /> Shift Rules & Templates</TabsTrigger>
        </TabsList>

        {/* WEEKLY ROSTER GRID */}
        <TabsContent value="roster" className="pt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Weekly Roster Matrix (28 Jul – 03 Aug 2026)</CardTitle>
                <CardDescription>Drag or select shifts for each day of the week.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead className="text-center">Mon (28)</TableHead>
                    <TableHead className="text-center">Tue (29)</TableHead>
                    <TableHead className="text-center">Wed (30)</TableHead>
                    <TableHead className="text-center">Thu (31)</TableHead>
                    <TableHead className="text-center">Fri (01)</TableHead>
                    <TableHead className="text-center">Sat (02)</TableHead>
                    <TableHead className="text-center">Sun (03)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-semibold text-sm">{r.empName}</div>
                        <div className="text-xs text-muted-foreground">{r.role}</div>
                      </TableCell>
                      <TableCell className="text-center text-xs"><Badge variant="outline">{r.mon}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge variant="outline">{r.tue}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge variant="outline">{r.wed}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge variant="outline">{r.thu}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge variant="outline">{r.fri}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge className="bg-gray-100 text-gray-600 border-gray-200">{r.sat}</Badge></TableCell>
                      <TableCell className="text-center text-xs"><Badge className="bg-gray-100 text-gray-600 border-gray-200">{r.sun}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button size="xs" variant="outline" className="gap-1" onClick={() => handleSwapRequest(r.empName)}>
                          <RefreshCw className="h-3 w-3" /> Swap
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIFT TEMPLATES */}
        <TabsContent value="templates" className="pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">General Shift (Default)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-bold text-lg">09:30 AM – 06:30 PM</div>
                <p className="text-xs text-muted-foreground">15 mins Grace Period • 9.0 Hours Total</p>
                <Badge variant="outline" className="mt-2">18 Employees Assigned</Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Morning Support Shift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-bold text-lg">07:00 AM – 04:00 PM</div>
                <p className="text-xs text-muted-foreground">10 mins Grace Period • 9.0 Hours Total</p>
                <Badge variant="outline" className="mt-2">4 Employees Assigned</Badge>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Night Operations Shift</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="font-bold text-lg">10:00 PM – 07:00 AM</div>
                <p className="text-xs text-muted-foreground">Night Allowance Included (+₹500/night)</p>
                <Badge variant="outline" className="mt-2">2 Employees Assigned</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
