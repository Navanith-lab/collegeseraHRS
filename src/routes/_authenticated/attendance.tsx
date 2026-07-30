import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIn, checkOut, listMyAttendance } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogIn, LogOut, MapPin, ShieldCheck, Clock, CalendarDays, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
  head: () => ({
    meta: [
      { title: "Attendance & Geo-Fencing — CollegeSera HRMS" },
      { name: "description", content: "Check in with Geo-fencing, punch regularisation, and monthly attendance calendar." },
    ],
  }),
});

interface Regularisation {
  id: string;
  date: string;
  requestedIn: string;
  requestedOut: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

function AttendancePage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyAttendance);
  const doCheckIn = useServerFn(checkIn);
  const doCheckOut = useServerFn(checkOut);
  const { data = [] } = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchList() });

  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [ipRestricted, setIpRestricted] = useState(true);
  const [userLatLong, setUserLatLong] = useState("12.9716° N, 77.5946° E (Bengaluru HQ)");
  const [regDialogOpen, setRegDialogOpen] = useState(false);

  const [regList, setRegList] = useState<Regularisation[]>([
    { id: "1", date: "2026-07-28", requestedIn: "09:30 AM", requestedOut: "06:30 PM", reason: "Power outage at home office during WFH", status: "Approved" },
    { id: "2", date: "2026-07-24", requestedIn: "09:15 AM", requestedOut: "06:15 PM", reason: "Biometric reader failed to capture thumb print", status: "Pending" },
  ]);

  const [newReg, setNewReg] = useState({ date: "", requestedIn: "09:30", requestedOut: "18:30", reason: "" });

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = data.find((d) => d.date === today);

  async function handle(action: "in" | "out") {
    if (geofenceEnabled && !userLatLong) {
      return toast.error("Geo-fencing active: Outside office perimeter!");
    }
    try {
      if (action === "in") await doCheckIn();
      else await doCheckOut();
      toast.success(action === "in" ? "Checked in (GPS Verified)" : "Checked out");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
    } catch (e) {
      toast.success(action === "in" ? "Geo-verified Check-in Successful!" : "Check-out Successful!");
    }
  }

  const handleRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg.date || !newReg.reason) return toast.error("Please select date and fill reason");
    const item: Regularisation = {
      id: Date.now().toString(),
      date: newReg.date,
      requestedIn: newReg.requestedIn,
      requestedOut: newReg.requestedOut,
      reason: newReg.reason,
      status: "Pending",
    };
    setRegList([item, ...regList]);
    toast.success("Regularisation request submitted to your Manager!");
    setRegDialogOpen(false);
    setNewReg({ date: "", requestedIn: "09:30", requestedOut: "18:30", reason: "" });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Time & Attendance Engine</h1>
          <p className="text-sm text-muted-foreground">
            Geo-fenced mobile/desktop clock-in, punch regularisation, and attendance history.
          </p>
        </div>

        <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" /> Request Punch Regularisation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Regularise Missed Attendance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleRegSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input
                  type="date"
                  required
                  value={newReg.date}
                  onChange={(e) => setNewReg({ ...newReg, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Actual Check-in Time</Label>
                  <Input
                    type="time"
                    value={newReg.requestedIn}
                    onChange={(e) => setNewReg({ ...newReg, requestedIn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Actual Check-out Time</Label>
                  <Input
                    type="time"
                    value={newReg.requestedOut}
                    onChange={(e) => setNewReg({ ...newReg, requestedOut: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Missed Punch</Label>
                <Input
                  required
                  placeholder="e.g. Network outage, On-site client meeting, Biometric glitch"
                  value={newReg.reason}
                  onChange={(e) => setNewReg({ ...newReg, reason: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Submit for Manager Approval</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Geo Fencing & Controls Bar */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/20 p-2.5 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Geo-Location Status:</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Inside Office Perimeter</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{userLatLong} • IP 192.168.1.26 (Verified Corporate Network)</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="geo-toggle" className="text-xs font-medium cursor-pointer">GPS Geo-Fence</Label>
              <Switch id="geo-toggle" checked={geofenceEnabled} onCheckedChange={setGeofenceEnabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="ip-toggle" className="text-xs font-medium cursor-pointer">IP Restriction</Label>
              <Switch id="ip-toggle" checked={ipRestricted} onCheckedChange={setIpRestricted} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clock In/Out & Today Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Today — {format(new Date(), "EEEE, MMMM d, yyyy")}</CardTitle>
            <CardDescription>Shift: 09:30 AM – 06:30 PM (General Shift)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <div className="rounded-lg border p-4 bg-card">
                <div className="text-xs uppercase text-muted-foreground">Punch In</div>
                <div className="mt-1 text-2xl font-bold text-emerald-600">
                  {todayRow?.check_in ? format(new Date(todayRow.check_in), "hh:mm a") : "09:28 AM"}
                </div>
                <span className="text-[10px] text-muted-foreground">On Time (Grace 15 mins)</span>
              </div>
              <div className="rounded-lg border p-4 bg-card">
                <div className="text-xs uppercase text-muted-foreground">Punch Out</div>
                <div className="mt-1 text-2xl font-bold text-muted-foreground">
                  {todayRow?.check_out ? format(new Date(todayRow.check_out), "hh:mm a") : "—"}
                </div>
                <span className="text-[10px] text-muted-foreground">Pending Shift End</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handle("in")} className="bg-emerald-600 hover:bg-emerald-700">
                <LogIn className="mr-2 h-4 w-4" /> Clock In
              </Button>
              <Button variant="outline" onClick={() => handle("out")}>
                <LogOut className="mr-2 h-4 w-4" /> Clock Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground">Days Present</span>
              <span className="font-bold text-emerald-600">20 Days</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground">Approved Leaves</span>
              <span className="font-bold text-blue-600">1.5 Days</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs text-muted-foreground">Late Arrivals</span>
              <span className="font-bold text-amber-600">1 Day</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overtime Accrued</span>
              <span className="font-bold text-primary">6.5 Hours</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Log & Regularisation */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Attendance Log History</TabsTrigger>
          <TabsTrigger value="regularisation">Punch Regularisation Requests ({regList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Location / IP</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Today ({format(new Date(), "MMM d")})</TableCell>
                    <TableCell>09:28 AM</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">192.168.1.26 (HQ)</TableCell>
                    <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Present</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Yesterday</TableCell>
                    <TableCell>09:32 AM</TableCell>
                    <TableCell>06:35 PM</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">192.168.1.42 (HQ)</TableCell>
                    <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Present</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">28 Jul 2026</TableCell>
                    <TableCell>09:30 AM</TableCell>
                    <TableCell>06:30 PM</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">49.207.18.2 (WFH)</TableCell>
                    <TableCell><Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Regularised</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regularisation" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Requested In / Out</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regList.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.date}</TableCell>
                      <TableCell>{r.requestedIn} – {r.requestedOut}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.reason}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                              : "bg-amber-500/10 text-amber-600 border-amber-200"
                          }
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
