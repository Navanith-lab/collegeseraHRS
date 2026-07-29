import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  listMyTravelRequests, listAllTravelRequests, createTravelRequest, updateTravelRequestStatus,
  listTravelTickets, addTravelTicket, listTravelExpenses, addTravelExpense, getCurrentContext,
} from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Plane, Ticket as TicketIcon, ReceiptText, ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/travel/")({
  head: () => ({ meta: [{ title: "Travel — CollegeSera HRMS" }, { name: "description", content: "Submit travel requests, manage tickets and expenses." }] }),
  component: TravelPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

function TravelPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: mineRaw = [], isLoading: loadingMine } = useQuery({ queryKey: ["my-travel"], queryFn: () => useServerFn(listMyTravelRequests)() });
  const { data: allRaw = [], isLoading: loadingAll } = useQuery({ queryKey: ["all-travel"], queryFn: () => useServerFn(listAllTravelRequests)(), enabled: isHr });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ purpose: "", destination: "", departure_date: "", return_date: "", travel_mode: "flight", accommodation_required: false, estimated_budget: 0 });
  const create = useMutation({
    mutationFn: () => useServerFn(createTravelRequest)({ data: form }),
    onSuccess: () => { toast.success("Travel request submitted"); setOpen(false); qc.invalidateQueries({ queryKey: ["my-travel"] }); qc.invalidateQueries({ queryKey: ["all-travel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Travel Management</h1>
          <p className="text-sm text-muted-foreground">Business travel requests, tickets and reimbursements.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New Travel Request</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Travel Request</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Purpose</Label><Textarea rows={2} value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Client meeting in Bengaluru" /></div>
              <div><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Departure</Label><Input type="date" value={form.departure_date} onChange={(e) => setForm({ ...form, departure_date: e.target.value })} /></div>
                <div><Label>Return</Label><Input type="date" value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} /></div>
              </div>
              <div><Label>Travel Mode</Label>
                <Select value={form.travel_mode} onValueChange={(v) => setForm({ ...form, travel_mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flight">Flight</SelectItem>
                    <SelectItem value="train">Train</SelectItem>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="own_vehicle">Own Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3"><Switch checked={form.accommodation_required} onCheckedChange={(v) => setForm({ ...form, accommodation_required: v })} /><Label>Accommodation Required</Label></div>
              <div><Label>Estimated Budget (₹)</Label><Input type="number" value={form.estimated_budget} onChange={(e) => setForm({ ...form, estimated_budget: Number(e.target.value) })} /></div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? "Submitting…" : "Submit"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My Requests</TabsTrigger>
          {isHr && <TabsTrigger value="desk">Travel Desk</TabsTrigger>}
        </TabsList>
        <TabsContent value="mine" className="mt-4">
          <TripsList rows={mineRaw as unknown as Trip[]} loading={loadingMine} showEmployee={false} />
        </TabsContent>
        {isHr && (
          <TabsContent value="desk" className="mt-4">
            <TripsList rows={allRaw as unknown as Trip[]} loading={loadingAll} showEmployee isHr />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

type Trip = { id: string; destination: string; purpose: string; departure_date: string; return_date: string; travel_mode: string; status: string; estimated_budget?: number | null; employee?: { full_name: string; employee_code: string } | null };

function TripsList({ rows, loading, showEmployee, isHr }: { rows: Trip[]; loading: boolean; showEmployee: boolean; isHr?: boolean }) {
  if (loading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
  if (rows.length === 0) return <Card><CardContent className="flex flex-col items-center gap-2 py-12"><Plane className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No travel requests yet</div></CardContent></Card>;
  return <div className="space-y-2">{rows.map((r) => <TripRow key={r.id} trip={r} showEmployee={showEmployee} isHr={!!isHr} />)}</div>;
}

function TripRow({ trip, showEmployee, isHr }: { trip: Trip; showEmployee: boolean; isHr: boolean }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const decide = useMutation({
    mutationFn: (v: { status: string; note?: string }) => useServerFn(updateTravelRequestStatus)({ data: { id: trip.id, ...v } }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["all-travel"] }); qc.invalidateQueries({ queryKey: ["my-travel"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const [note, setNote] = useState("");
  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-muted/40">
            <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">{trip.destination}<Badge variant="outline" className="text-xs capitalize">{trip.travel_mode.replace("_", " ")}</Badge></div>
              <div className="text-xs text-muted-foreground">{trip.departure_date} → {trip.return_date} · {trip.purpose}</div>
              {showEmployee && trip.employee && <div className="text-xs text-muted-foreground">{trip.employee.full_name} ({trip.employee.employee_code})</div>}
            </div>
            <Badge className={statusColor[trip.status] ?? ""}>{trip.status}</Badge>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid gap-4 border-t px-4 py-4 md:grid-cols-2">
            <TicketsSection tripId={trip.id} />
            <ExpensesSection tripId={trip.id} />
          </div>
          {isHr && trip.status === "pending" && (
            <div className="flex items-center gap-2 border-t px-4 py-3">
              <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="max-w-sm" />
              <Button size="sm" onClick={() => decide.mutate({ status: "approved", note })}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => decide.mutate({ status: "rejected", note })}>Reject</Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function TicketsSection({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["trip-tickets", tripId], queryFn: () => useServerFn(listTravelTickets)({ data: { travel_request_id: tripId } }) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ticket_type: "flight", from_location: "", to_location: "", travel_date: "", carrier_name: "", ticket_number: "", seat_class: "economy", amount: 0, ticket_url: "" });
  const add = useMutation({
    mutationFn: () => useServerFn(addTravelTicket)({ data: { travel_request_id: tripId, ...form } }),
    onSuccess: () => { toast.success("Ticket added"); setOpen(false); qc.invalidateQueries({ queryKey: ["trip-tickets", tripId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><TicketIcon className="h-4 w-4" />Tickets</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Ticket</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <Select value={form.ticket_type} onValueChange={(v) => setForm({ ...form, ticket_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flight">Flight</SelectItem><SelectItem value="train">Train</SelectItem><SelectItem value="bus">Bus</SelectItem></SelectContent></Select>
              <div className="grid grid-cols-2 gap-2"><Input placeholder="From" value={form.from_location} onChange={(e) => setForm({ ...form, from_location: e.target.value })} /><Input placeholder="To" value={form.to_location} onChange={(e) => setForm({ ...form, to_location: e.target.value })} /></div>
              <Input type="date" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} />
              <div className="grid grid-cols-2 gap-2"><Input placeholder="Carrier" value={form.carrier_name} onChange={(e) => setForm({ ...form, carrier_name: e.target.value })} /><Input placeholder="Ticket #" value={form.ticket_number} onChange={(e) => setForm({ ...form, ticket_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2"><Input placeholder="Class" value={form.seat_class} onChange={(e) => setForm({ ...form, seat_class: e.target.value })} /><Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <Input placeholder="Ticket URL (optional)" value={form.ticket_url} onChange={(e) => setForm({ ...form, ticket_url: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={() => add.mutate()} disabled={add.isPending}>Add ticket</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {data.length === 0 ? <div className="rounded border border-dashed py-4 text-center text-xs text-muted-foreground">No tickets</div> :
        <div className="space-y-1">{(data as unknown as Array<{ id: string; ticket_type: string; from_location: string; to_location: string; travel_date: string; carrier_name?: string | null; amount: number; ticket_url?: string | null }>).map((t: { id: string; ticket_type: string; from_location: string; to_location: string; travel_date: string; carrier_name?: string | null; amount: number; ticket_url?: string | null }) => (
          <div key={t.id} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
            <div><div className="font-medium capitalize">{t.ticket_type} · {t.from_location} → {t.to_location}</div><div className="text-muted-foreground">{t.travel_date} · {t.carrier_name ?? ""}</div></div>
            <div className="flex items-center gap-2"><span className="font-semibold">₹{Number(t.amount).toLocaleString()}</span>{t.ticket_url && <a href={t.ticket_url} target="_blank" rel="noreferrer" className="text-primary underline">Ticket</a>}</div>
          </div>
        ))}</div>}
    </div>
  );
}

function ExpensesSection({ tripId }: { tripId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["trip-expenses", tripId], queryFn: () => useServerFn(listTravelExpenses)({ data: { travel_request_id: tripId } }) });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "Food & Meals", description: "", amount: 0, expense_date: "", receipt_url: "" });
  const add = useMutation({
    mutationFn: () => useServerFn(addTravelExpense)({ data: { travel_request_id: tripId, ...form } }),
    onSuccess: () => { toast.success("Expense added"); setOpen(false); qc.invalidateQueries({ queryKey: ["trip-expenses", tripId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const total = data.reduce((sum: number, e: { amount: number }) => sum + Number(e.amount), 0);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><ReceiptText className="h-4 w-4" />Expenses · <span className="text-primary">₹{total.toLocaleString()}</span></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="mr-1 h-3 w-3" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Accommodation","Food & Meals","Local Transport","Fuel","Toll","Parking","Miscellaneous"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
              <Input placeholder="Receipt URL (optional)" value={form.receipt_url} onChange={(e) => setForm({ ...form, receipt_url: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={() => add.mutate()} disabled={add.isPending}>Add expense</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {data.length === 0 ? <div className="rounded border border-dashed py-4 text-center text-xs text-muted-foreground">No expenses</div> :
        <div className="space-y-1">{(data as unknown as Array<{ id: string; category: string; description: string; amount: number; expense_date: string; status: string; receipt_url?: string | null }>).map((e: { id: string; category: string; description: string; amount: number; expense_date: string; status: string; receipt_url?: string | null | null }) => (
          <div key={e.id} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
            <div><div className="font-medium">{e.category}</div><div className="text-muted-foreground">{e.description} · {e.expense_date}</div></div>
            <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{e.status}</Badge><span className="font-semibold">₹{Number(e.amount).toLocaleString()}</span></div>
          </div>
        ))}</div>}
    </div>
  );
}
