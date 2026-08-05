import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileEdit, Plus, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/regularization")({
  component: RegularizationPage,
});

interface RegularizationItem {
  id: string;
  date: string;
  requestedIn: string;
  requestedOut: string;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

function RegularizationPage() {
  const [items, setItems] = useState<RegularizationItem[]>([
    { id: "1", date: "2026-08-04", requestedIn: "09:30 AM", requestedOut: "06:30 PM", reason: "Biometric thumb scanner glitch", status: "Approved" },
    { id: "2", date: "2026-08-01", requestedIn: "09:15 AM", requestedOut: "06:15 PM", reason: "Power outage at home office during WFH", status: "Pending" },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ date: "", requestedIn: "09:30", requestedOut: "18:30", reason: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.reason) return toast.error("Please fill in date and reason");
    const newItem: RegularizationItem = {
      id: Date.now().toString(),
      date: form.date,
      requestedIn: form.requestedIn,
      requestedOut: form.requestedOut,
      reason: form.reason,
      status: "Pending",
    };
    setItems([newItem, ...items]);
    toast.success("Attendance regularization applied!");
    setDialogOpen(false);
    setForm({ date: "", requestedIn: "09:30", requestedOut: "18:30", reason: "" });
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Regularization</h1>
          <p className="text-sm text-muted-foreground">
            Apply your attendance to ensure accurate records and smooth processing.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="h-4 w-4" /> Apply for Regularization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Regularization</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <Label>Select Date</Label>
                <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Time</Label>
                  <Input type="time" value={form.requestedIn} onChange={(e) => setForm({ ...form, requestedIn: e.target.value })} />
                </div>
                <div>
                  <Label>Check-out Time</Label>
                  <Input type="time" value={form.requestedOut} onChange={(e) => setForm({ ...form, requestedOut: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Reason</Label>
                <Input required placeholder="e.g. Missed punch, WFH power cut, Client meeting" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-slate-900 text-white">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Regularization Applications</CardTitle>
        </CardHeader>
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
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.date}</TableCell>
                  <TableCell>{item.requestedIn} – {item.requestedOut}</TableCell>
                  <TableCell className="text-muted-foreground">{item.reason}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                          : "bg-amber-500/10 text-amber-600 border-amber-200"
                      }
                    >
                      {item.status}
                    </Badge>
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
