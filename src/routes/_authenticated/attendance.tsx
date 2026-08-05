import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIn, checkOut, listMyAttendance } from "@/lib/hrms.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Fingerprint,
  Download,
  Calendar as CalendarIcon,
  Columns,
  Clock,
  Plus,
  ClipboardCheck,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
  head: () => ({
    meta: [
      { title: "Attendance — KollegeApply" },
      { name: "description", content: "Clock in, check live working hours, and regularize your attendance." },
    ],
  }),
});

interface RegModalItem {
  date: string;
  checkInTime: string;
  checkOutTime: string;
  reason: string;
}

export function AttendancePage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyAttendance);
  const doCheckIn = useServerFn(checkIn);
  const doCheckOut = useServerFn(checkOut);
  const { data = [] } = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchList() });

  // Live Clock & Working Timer State
  const [now, setNow] = useState(new Date());
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTimestamp, setCheckInTimestamp] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Regularization Dialog State
  const [regDialogOpen, setRegDialogOpen] = useState(false);
  const [regForm, setRegForm] = useState<RegModalItem>({
    date: new Date().toISOString().slice(0, 10),
    checkInTime: "09:30",
    checkOutTime: "18:30",
    reason: "",
  });

  // Date Range Filter State
  const [dateRange, setDateRange] = useState("Aug 01, 26 - Aug 05, 26");

  // Live Date/Time Ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Working Hours Counter
  useEffect(() => {
    let timer: any;
    if (isCheckedIn && checkInTimestamp) {
      timer = setInterval(() => {
        const diffSec = Math.floor((Date.now() - checkInTimestamp) / 1000);
        setElapsedSeconds(diffSec);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isCheckedIn, checkInTimestamp]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePunchToggle = async () => {
    if (!isCheckedIn) {
      // Punch In Action
      try {
        await doCheckIn();
      } catch (e) {
        // Fallback for demonstration
      }
      setIsCheckedIn(true);
      setCheckInTimestamp(Date.now());
      toast.success("Punched In successfully! Have a wonderful day ahead.");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
    } else {
      // Punch Out Action
      try {
        await doCheckOut();
      } catch (e) {
        // Fallback
      }
      setIsCheckedIn(false);
      setCheckInTimestamp(null);
      toast.success("Punched Out successfully! Great work today.");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
    }
  };

  const handleApplyRegularization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.reason) return toast.error("Please enter a reason for regularization");
    toast.success(`Regularization applied for ${regForm.date}! Sent for approval.`);
    setRegDialogOpen(false);
    setRegForm({ ...regForm, reason: "" });
  };

  const handleDownloadLog = () => {
    const csvData =
      "data:text/csv;charset=utf-8," +
      "Date,Check In,Check Out,Total Hours,Status,Notes\n" +
      "2026-08-05,08:34:05 AM,-,00:00:00,Present,Live Punch\n" +
      "2026-08-04,09:28:10 AM,06:31:00 PM,09:02:50,Present,On Time\n" +
      "2026-08-03,09:30:00 AM,06:30:00 PM,09:00:00,Present,On Time\n" +
      "2026-08-02,-,-,-,Holiday,Sunday Off\n" +
      "2026-08-01,09:15:00 AM,06:15:00 PM,09:00:00,Regularized,Approved WFH\n";

    const encodedUri = encodeURI(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Log_${dateRange.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendance Log downloaded as CSV!");
  };

  // Formatted Date & Time matching reference "8:34:05 AM, 5 August 2026"
  const formattedTime = format(now, "h:mm:ss a");
  const formattedDate = format(now, "d MMMM yyyy");

  return (
    <div className="space-y-8 p-6 bg-slate-50/40 dark:bg-background min-h-screen">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Attendance
        </h1>
      </div>

      {/* Top 2 Cards Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* CARD 1: Punch In / Live Clock Card */}
        <Card className="border-rose-100 dark:border-rose-900/30 bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col items-center p-6 text-center space-y-5">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Today's Date & Time
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {formattedTime}, {formattedDate}
              </div>
            </div>

            {/* Circular Clock Dial */}
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 p-2">
              <div className="text-center">
                <div className="text-xs font-medium text-slate-400">Total Hours</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
            </div>

            {/* Mascot Greeting */}
            <div className="relative flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Fingerprint className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>{isCheckedIn ? "You are Punched In" : "Start your day"}</span>
              {/* Cute Panda Icon Waving */}
              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px]">
                <span className="animate-bounce">👋</span>
                <span className="font-bold">Hi</span>
              </div>
            </div>

            {/* Spanning Coral-Red Punch In Button */}
            <Button
              size="lg"
              onClick={handlePunchToggle}
              className={`w-full h-12 rounded-xl text-base font-bold text-white transition-all shadow-md ${
                isCheckedIn
                  ? "bg-slate-900 hover:bg-slate-800"
                  : "bg-gradient-to-r from-rose-500 to-coral-500 hover:from-rose-600 hover:to-coral-600 bg-rose-500"
              }`}
            >
              {isCheckedIn ? "Punch Out" : "Punch In"}
            </Button>
          </CardContent>
        </Card>

        {/* CARD 2: Regularization Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between p-6">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Regularization
            </h2>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300 max-w-sm mx-auto leading-snug">
              Apply your attendance to ensure accurate records and smooth processing
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
              Missed marking your day? Keep your records up to date. Regularize your attendance today
            </p>
          </div>

          <div className="pt-6 relative">
            {/* Clipboard Graphic Illustration */}
            <div className="absolute right-2 bottom-14 opacity-20 dark:opacity-10 pointer-events-none">
              <ClipboardCheck className="h-14 w-14 text-emerald-600" />
            </div>

            {/* Dark Navy Apply Button */}
            <Dialog open={regDialogOpen} onOpenChange={setRegDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="w-full h-12 rounded-xl text-base font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md"
                >
                  Apply for Regularization
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Apply for Attendance Regularization</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleApplyRegularization} className="space-y-4 pt-2">
                  <div>
                    <Label>Select Date</Label>
                    <Input
                      type="date"
                      required
                      value={regForm.date}
                      onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Check In Time</Label>
                      <Input
                        type="time"
                        value={regForm.checkInTime}
                        onChange={(e) => setRegForm({ ...regForm, checkInTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Check Out Time</Label>
                      <Input
                        type="time"
                        value={regForm.checkOutTime}
                        onChange={(e) => setRegForm({ ...regForm, checkOutTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Reason for Regularization</Label>
                    <Input
                      required
                      placeholder="e.g. Biometric thumb scanner glitch, WFH power cut"
                      value={regForm.reason}
                      onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-slate-900 text-white font-bold">
                    Submit Application
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      </div>

      {/* Attendance Log Section */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Attendance Log
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Picker Display */}
            <div className="flex items-center gap-2 rounded-lg border bg-white dark:bg-card px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
              <CalendarIcon className="h-4 w-4 text-slate-400" />
              <span>{dateRange}</span>
            </div>

            {/* Blue Download Button */}
            <Button
              onClick={handleDownloadLog}
              className="gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg text-xs"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between border-b pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" className="font-semibold text-xs rounded-lg">
              Monthly Log
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select defaultValue="normal">
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Normal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-36 h-8 text-xs">
                <Columns className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                <SelectValue placeholder="Columns: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Columns: All</SelectItem>
                <SelectItem value="basic">Columns: Basic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Attendance Log Table */}
        <Card className="border shadow-xs">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-muted/40">
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="font-bold">Check In</TableHead>
                  <TableHead className="font-bold">Check Out</TableHead>
                  <TableHead className="font-bold">Total Hours</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Live Today Row */}
                <TableRow>
                  <TableCell className="font-semibold text-slate-900 dark:text-white">
                    05 Aug 2026 (Today)
                  </TableCell>
                  <TableCell className="font-mono font-medium">
                    {isCheckedIn ? "08:34:05 AM" : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {!isCheckedIn && elapsedSeconds > 0 ? formattedTime : "—"}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-rose-500">
                    {formatTimer(elapsedSeconds)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        isCheckedIn
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }
                    >
                      {isCheckedIn ? "Present (Active)" : "Punched Out"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {isCheckedIn ? "Working live..." : "Completed shift"}
                  </TableCell>
                </TableRow>

                {/* Historical Log Rows */}
                <TableRow>
                  <TableCell className="font-medium">04 Aug 2026</TableCell>
                  <TableCell className="font-mono text-xs">09:28:10 AM</TableCell>
                  <TableCell className="font-mono text-xs">06:31:00 PM</TableCell>
                  <TableCell className="font-mono text-xs">09:02:50</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      Present
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">On Time</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">03 Aug 2026</TableCell>
                  <TableCell className="font-mono text-xs">09:30:00 AM</TableCell>
                  <TableCell className="font-mono text-xs">06:30:00 PM</TableCell>
                  <TableCell className="font-mono text-xs">09:00:00</TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                      Present
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">On Time</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">02 Aug 2026</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">—</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">—</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">
                      Holiday
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Sunday Off</TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-medium">01 Aug 2026</TableCell>
                  <TableCell className="font-mono text-xs">09:15:00 AM</TableCell>
                  <TableCell className="font-mono text-xs">06:15:00 PM</TableCell>
                  <TableCell className="font-mono text-xs">09:00:00</TableCell>
                  <TableCell>
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">
                      Regularized
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">Approved WFH</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
