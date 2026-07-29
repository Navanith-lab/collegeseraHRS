import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { checkIn, checkOut, listMyAttendance } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/attendance")({
  component: AttendancePage,
  head: () => ({
    meta: [
      { title: "Attendance — CollegeSera HRMS" },
      { name: "description", content: "Check in, check out and view your attendance history." },
    ],
  }),
});

function AttendancePage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listMyAttendance);
  const doCheckIn = useServerFn(checkIn);
  const doCheckOut = useServerFn(checkOut);
  const { data = [] } = useQuery({ queryKey: ["my-attendance"], queryFn: () => fetchList() });

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = data.find((d) => d.date === today);

  async function handle(action: "in" | "out") {
    try {
      if (action === "in") await doCheckIn();
      else await doCheckOut();
      toast.success(action === "in" ? "Checked in" : "Checked out");
      qc.invalidateQueries({ queryKey: ["my-attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance</h1>
        <p className="text-sm text-muted-foreground">Your check-in / check-out history and today's status.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Today — {format(new Date(), "EEEE, MMMM d")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <div className="grid flex-1 grid-cols-2 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Check-in</div>
                <div className="mt-1 text-xl font-semibold">
                  {todayRow?.check_in ? format(new Date(todayRow.check_in), "hh:mm a") : "—"}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-xs uppercase text-muted-foreground">Check-out</div>
                <div className="mt-1 text-xl font-semibold">
                  {todayRow?.check_out ? format(new Date(todayRow.check_out), "hh:mm a") : "—"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handle("in")} disabled={!!todayRow?.check_in}>
                <LogIn className="mr-2 h-4 w-4" /> Check in
              </Button>
              <Button
                variant="outline"
                onClick={() => handle("out")}
                disabled={!todayRow?.check_in || !!todayRow?.check_out}
              >
                <LogOut className="mr-2 h-4 w-4" /> Check out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>This month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {data.filter((d) => d.date.startsWith(today.slice(0, 7))).length}
              <span className="ml-1 text-sm font-normal text-muted-foreground">days present</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent attendance</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No attendance records yet.
                  </TableCell>
                </TableRow>
              )}
              {data.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{format(new Date(r.date), "EEE, MMM d")}</TableCell>
                  <TableCell>{r.check_in ? format(new Date(r.check_in), "hh:mm a") : "—"}</TableCell>
                  <TableCell>{r.check_out ? format(new Date(r.check_out), "hh:mm a") : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{r.notes ?? ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
