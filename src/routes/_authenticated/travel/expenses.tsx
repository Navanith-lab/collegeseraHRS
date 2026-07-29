import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listTravelExpenses, updateTravelExpenseStatus, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReceiptText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/travel/expenses")({
  head: () => ({ meta: [{ title: "Travel Expenses — CollegeSera HRMS" }, { name: "description", content: "Track and reimburse travel expenses." }] }),
  component: ExpensesPage,
});

type Exp = { id: string; category: string; description: string; amount: number; expense_date: string; status: string; approved_amount?: number | null; receipt_url?: string | null; travel_request_id: string; employee?: { full_name: string; employee_code: string } | null };

function ExpensesPage() {
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: dataRaw = [], isLoading } = useQuery({ queryKey: ["all-travel-expenses"], queryFn: () => useServerFn(listTravelExpenses)({ data: {} }) });

  const data = dataRaw as unknown as Exp[];
  const grouped = data.reduce((acc: Record<string, Exp[]>, e: Exp) => { (acc[e.travel_request_id] ||= []).push(e); return acc; }, {});
  const total = data.reduce((s: number, e: Exp) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Travel Expenses</h1><p className="text-sm text-muted-foreground">Reimbursable travel spends.</p></div>
        <Card className="bg-primary text-primary-foreground"><CardContent className="p-4"><div className="text-xs opacity-90">Total reimbursable</div><div className="text-2xl font-bold">₹{total.toLocaleString()}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="mine">
        <TabsList><TabsTrigger value="mine">By Trip</TabsTrigger>{isHr && <TabsTrigger value="approvals">Approvals</TabsTrigger>}</TabsList>
        <TabsContent value="mine" className="mt-4 space-y-3">
          {isLoading ? Array.from({length:2}).map((_,i)=><Skeleton key={i} className="h-24 w-full"/>) :
           Object.keys(grouped).length === 0 ? <Card><CardContent className="flex flex-col items-center gap-2 py-12"><ReceiptText className="h-8 w-8 text-muted-foreground"/><div className="text-sm text-muted-foreground">No expenses yet</div></CardContent></Card> :
           Object.entries(grouped).map(([tripId, items]) => {
             const subtotal = (items as Exp[]).reduce((s, e) => s + Number(e.amount), 0);
             return (
               <Card key={tripId}>
                 <CardHeader className="pb-2"><CardTitle className="text-sm">Trip · <span className="text-muted-foreground font-normal text-xs">{tripId.slice(0,8)}</span> <span className="ml-auto font-semibold">Subtotal ₹{subtotal.toLocaleString()}</span></CardTitle></CardHeader>
                 <CardContent className="p-0"><Table><TableBody>{(items as Exp[]).map(e => (
                   <TableRow key={e.id}><TableCell>{e.category}</TableCell><TableCell className="text-xs text-muted-foreground">{e.description}</TableCell><TableCell>{e.expense_date}</TableCell><TableCell><Badge variant="outline">{e.status}</Badge></TableCell><TableCell className="text-right font-semibold">₹{Number(e.amount).toLocaleString()}</TableCell></TableRow>
                 ))}</TableBody></Table></CardContent>
               </Card>
             );
           })
          }
        </TabsContent>
        {isHr && <TabsContent value="approvals" className="mt-4"><ApprovalsTable rows={data.filter((e: Exp) => e.status === "pending")} /></TabsContent>}
      </Tabs>
    </div>
  );
}

function ApprovalsTable({ rows }: { rows: Exp[] }) {
  const qc = useQueryClient();
  const [amt, setAmt] = useState<Record<string, string>>({});
  const upd = useMutation({
    mutationFn: (v: { id: string; status: string; approved_amount?: number }) => useServerFn(updateTravelExpenseStatus)({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["all-travel-expenses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  if (rows.length === 0) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No expenses pending approval</CardContent></Card>;
  return (
    <Card><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead>Claimed</TableHead><TableHead>Approved ₹</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>{rows.map(e => (
          <TableRow key={e.id}>
            <TableCell>{e.employee?.full_name}</TableCell>
            <TableCell>{e.category}</TableCell>
            <TableCell className="text-xs">{e.description}</TableCell>
            <TableCell>{e.expense_date}</TableCell>
            <TableCell>₹{Number(e.amount).toLocaleString()}</TableCell>
            <TableCell><Input className="h-8 w-24" type="number" placeholder={String(e.amount)} value={amt[e.id] ?? ""} onChange={(v) => setAmt({ ...amt, [e.id]: v.target.value })} /></TableCell>
            <TableCell className="flex gap-1"><Button size="sm" onClick={() => upd.mutate({ id: e.id, status: "approved", approved_amount: Number(amt[e.id] || e.amount) })}>Approve</Button><Button size="sm" variant="destructive" onClick={() => upd.mutate({ id: e.id, status: "rejected" })}>Reject</Button></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </CardContent></Card>
  );
}
