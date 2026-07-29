import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listTravelTickets } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/travel/tickets")({
  head: () => ({ meta: [{ title: "Travel Tickets — CollegeSera HRMS" }, { name: "description", content: "All employee travel tickets." }] }),
  component: TicketsPage,
});

function TicketsPage() {
  const { data = [], isLoading } = useQuery({ queryKey: ["all-travel-tickets"], queryFn: () => useServerFn(listTravelTickets)({ data: {} }) });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Travel Tickets</h1><p className="text-sm text-muted-foreground">All flight, train and bus tickets.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{data.length} tickets</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div> :
           data.length === 0 ? <div className="flex flex-col items-center gap-2 py-12"><Ticket className="h-8 w-8 text-muted-foreground"/><div className="text-sm text-muted-foreground">No tickets booked yet</div></div> :
            <Table>
              <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>From → To</TableHead><TableHead>Date</TableHead><TableHead>Carrier</TableHead><TableHead>Class</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>{(data as unknown as Array<{ id: string; employee?: { full_name: string; employee_code: string } | null; ticket_type: string; from_location: string; to_location: string; travel_date: string; carrier_name?: string | null; seat_class?: string | null; amount: number; status: string; ticket_url?: string | null }>).map((t: { id: string; employee?: { full_name: string; employee_code: string } | null; ticket_type: string; from_location: string; to_location: string; travel_date: string; carrier_name?: string | null; seat_class?: string | null; amount: number; status: string; ticket_url?: string | null }) => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.employee?.full_name ?? "—"}</TableCell>
                  <TableCell className="capitalize">{t.ticket_type}</TableCell>
                  <TableCell>{t.from_location} → {t.to_location}</TableCell>
                  <TableCell>{t.travel_date}</TableCell>
                  <TableCell>{t.carrier_name ?? "—"}</TableCell>
                  <TableCell className="capitalize">{t.seat_class ?? "—"}</TableCell>
                  <TableCell className="font-semibold">₹{Number(t.amount).toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                  <TableCell>{t.ticket_url && <a href={t.ticket_url} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Download</a>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
}
