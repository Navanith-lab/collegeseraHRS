import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LifeBuoy, Clock, AlertTriangle, CheckCircle, Plus, Search, MessageSquare, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/helpdesk")({
  component: HelpdeskPage,
});

interface Ticket {
  id: string;
  ticketNo: string;
  subject: string;
  category: "Payroll & Tax" | "IT & Laptop" | "Leave & Attendance" | "Benefits & Insurance";
  priority: "Low" | "Medium" | "High" | "Urgent";
  raisedBy: string;
  assignedTo: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  createdAt: string;
  slaDeadline: string;
  description: string;
  responses: { sender: string; time: string; text: string }[];
}

const initialTickets: Ticket[] = [
  {
    id: "1",
    ticketNo: "TICK-1029",
    subject: "Form 16 Tax Deduction Mismatch",
    category: "Payroll & Tax",
    priority: "High",
    raisedBy: "Neha Gupta (Senior Frontend Dev)",
    assignedTo: "Payroll Admin",
    status: "Open",
    createdAt: "2026-07-29 10:30 AM",
    slaDeadline: "24h left",
    description: "My TDS calculation for Q4 shows extra deduction of ₹4,500. Please verify Tax Regime selected.",
    responses: [
      { sender: "Neha Gupta", time: "2026-07-29 10:30 AM", text: "Attached investment proof submission receipt." },
    ],
  },
  {
    id: "2",
    ticketNo: "TICK-1030",
    subject: "VPN credentials for Remote Access",
    category: "IT & Laptop",
    priority: "Urgent",
    raisedBy: "Vikram Singh (DevOps Eng)",
    assignedTo: "IT Support",
    status: "In Progress",
    createdAt: "2026-07-30 08:15 AM",
    slaDeadline: "4h left",
    description: "MacBook reboot wiped VPN tunnel configs. Need urgent re-authorization for staging cluster.",
    responses: [
      { sender: "Vikram Singh", time: "2026-07-30 08:15 AM", text: "Unable to access production logs." },
      { sender: "IT Support", time: "2026-07-30 09:00 AM", text: "Regenerating auth tokens now." },
    ],
  },
  {
    id: "3",
    ticketNo: "TICK-1025",
    subject: "Sick Leave Regularisation for July 24",
    category: "Leave & Attendance",
    priority: "Low",
    raisedBy: "Ananya Roy (Marketing Specialist)",
    assignedTo: "HR Operations",
    status: "Resolved",
    createdAt: "2026-07-25 02:00 PM",
    slaDeadline: "SLA Met",
    description: "Power outage caused missed biometric punch. Manager approved WFH.",
    responses: [
      { sender: "HR Operations", time: "2026-07-26 11:00 AM", text: "Regularisation approved and attendance updated." },
    ],
  },
];

function HelpdeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");

  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "Payroll & Tax" as Ticket["category"],
    priority: "Medium" as Ticket["priority"],
    description: "",
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description) return toast.error("Please fill in subject and description");
    const item: Ticket = {
      id: Date.now().toString(),
      ticketNo: `TICK-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newTicket,
      raisedBy: "Current Employee (You)",
      assignedTo: "Unassigned HR",
      status: "Open",
      createdAt: new Date().toLocaleString(),
      slaDeadline: "24h SLA",
      responses: [{ sender: "You", time: new Date().toLocaleTimeString(), text: newTicket.description }],
    };
    setTickets([item, ...tickets]);
    toast.success("Ticket raised successfully! SLA response initiated.");
    setIsDialogOpen(false);
    setNewTicket({ subject: "", category: "Payroll & Tax", priority: "Medium", description: "" });
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;
    const updated = tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        const nextResponses = [...t.responses, { sender: "HR Support", time: new Date().toLocaleTimeString(), text: replyText }];
        return { ...t, responses: nextResponses, status: "In Progress" as const };
      }
      return t;
    });
    setTickets(updated);
    setSelectedTicket(updated.find((t) => t.id === selectedTicket.id) || null);
    setReplyText("");
    toast.success("Response posted to ticket!");
  };

  const handleResolveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Resolved" as const } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: "Resolved" } : null));
    }
    toast.success("Ticket marked as Resolved");
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.raisedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HR Helpdesk & SLA Ticketing</h1>
          <p className="text-sm text-muted-foreground">
            Employee self-service ticketing system for payroll, IT hardware, attendance, and HR policy queries.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Raise HR Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit New Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Ticket Subject</Label>
                <Input
                  required
                  placeholder="Brief title of your issue..."
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(val: any) => setNewTicket({ ...newTicket, category: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Payroll & Tax">Payroll & Tax</SelectItem>
                      <SelectItem value="IT & Laptop">IT & Laptop</SelectItem>
                      <SelectItem value="Leave & Attendance">Leave & Attendance</SelectItem>
                      <SelectItem value="Benefits & Insurance">Benefits & Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(val: any) => setNewTicket({ ...newTicket, priority: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Detailed Description</Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Explain your request, attach reference details..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">Submit Ticket</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter((t) => t.status === "Open").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Awaiting HR assignment</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {tickets.filter((t) => t.status === "In Progress").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Active SLA countdown</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {tickets.filter((t) => t.priority === "Urgent").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Requires immediate action</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved (Avg SLA 4.2h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {tickets.filter((t) => t.status === "Resolved").length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">98.4% SLA Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Ticket Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Ticket Queue</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ticket #, subject, user..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Payroll & Tax">Payroll & Tax</SelectItem>
                  <SelectItem value="IT & Laptop">IT & Laptop</SelectItem>
                  <SelectItem value="Leave & Attendance">Leave & Attendance</SelectItem>
                  <SelectItem value="Benefits & Insurance">Benefits & Insurance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {filteredTickets.map((t) => (
              <div key={t.id} className="flex flex-col gap-4 p-4 hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <Badge variant="outline" className="mt-0.5 font-mono text-xs">
                    {t.ticketNo}
                  </Badge>
                  <div>
                    <h4 className="font-semibold text-foreground hover:text-primary cursor-pointer" onClick={() => setSelectedTicket(t)}>
                      {t.subject}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Raised by: <span className="font-medium text-foreground">{t.raisedBy}</span> • Category: {t.category} • Created: {t.createdAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <Badge
                    className={
                      t.priority === "Urgent"
                        ? "bg-rose-500/10 text-rose-600 border-rose-200"
                        : t.priority === "High"
                        ? "bg-amber-500/10 text-amber-600 border-amber-200"
                        : "bg-blue-500/10 text-blue-600 border-blue-200"
                    }
                  >
                    {t.priority}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <Clock className="h-3.5 w-3.5 text-amber-500" /> {t.slaDeadline}
                  </span>
                  <Badge
                    className={
                      t.status === "Open"
                        ? "bg-blue-500/10 text-blue-600 border-blue-200"
                        : t.status === "In Progress"
                        ? "bg-amber-500/10 text-amber-600 border-amber-200"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                    }
                  >
                    {t.status}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => setSelectedTicket(t)}>
                    View Thread
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Response Modal Thread */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="outline" className="font-mono">{selectedTicket.ticketNo}</Badge>
                  <DialogTitle className="mt-2 text-xl">{selectedTicket.subject}</DialogTitle>
                </div>
                <Badge>{selectedTicket.status}</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-muted/40 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedTicket.raisedBy}</span>
                  <span>{selectedTicket.createdAt}</span>
                </div>
                <p className="text-sm text-foreground">{selectedTicket.description}</p>
              </div>

              {/* Message Thread */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {selectedTicket.responses.map((resp, i) => (
                  <div key={i} className="rounded-md border p-3 bg-card space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium text-primary">{resp.sender}</span>
                      <span>{resp.time}</span>
                    </div>
                    <p className="text-sm text-foreground/90">{resp.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              {selectedTicket.status !== "Resolved" && (
                <div className="space-y-3 pt-2">
                  <Label>Reply to Ticket</Label>
                  <Textarea
                    rows={3}
                    placeholder="Write response or resolution..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <Button variant="secondary" onClick={() => handleResolveTicket(selectedTicket.id)}>
                      <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" /> Mark as Resolved
                    </Button>
                    <Button onClick={handleSendReply}>Post Reply</Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
