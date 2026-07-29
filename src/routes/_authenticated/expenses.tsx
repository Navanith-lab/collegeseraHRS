import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyExpenseClaims, listAllExpenseClaims, createExpenseClaim, decideExpenseClaim, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Receipt } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expense Claims — CollegeSera HRMS" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin" || r === "manager");
  const { data: mine = [] } = useQuery({ queryKey: ["my-expenses"], queryFn: () => useServerFn(listMyExpenseClaims)() });
  const { data: all = [] } = useQuery({ queryKey: ["all-expenses"], queryFn: () => useServerFn(listAllExpenseClaims)(), enabled: isHr });
  const rows = isHr ? all : mine;

  const doCreate = useServerFn(createExpenseClaim);
  const doDecide = useServerFn(decideExpenseClaim);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "travel", total_amount: 0 });

  const create = useMutation({
    mutationFn: () => doCreate({ data: { title: form.title, category: form.category, items: [{ date: new Date().toISOString().slice(0,10), description: form.title, category: form.category, amount: form.total_amount }] } }),
    onSuccess: () => { toast.success("Submitted"); qc.invalidateQueries({ queryKey: ["my-expenses"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const decide = useMutation({
    mutationFn: (p: { id: string; action: "approve" | "reject"; manager_note?: string }) => doDecide({ data: p }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["all-expenses"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const badge = (s: string) => s === "approved" || s === "paid" ? "default" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense Claims</h1>
          <p className="text-sm text-muted-foreground">Submit and track reimbursement requests.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />New claim</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit expense claim</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["travel","food","office","training","other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount</Label><Input type="number" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: +e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.title || !form.total_amount}>Submit</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} claims</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><Receipt className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No claims yet</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow>{isHr && <TableHead>Employee</TableHead>}<TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead>{isHr && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const row = r as { id: string; title: string; category: string; total_amount: number; status: string; employee?: { full_name: string } };
                  return (
                    <TableRow key={row.id}>
                      {isHr && <TableCell>{row.employee?.full_name ?? "—"}</TableCell>}
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>₹{Number(row.total_amount).toLocaleString()}</TableCell>
                      <TableCell><Badge variant={badge(row.status)}>{row.status}</Badge></TableCell>
                      {isHr && (
                        <TableCell>
                          {row.status === "submitted" && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: row.id, action: "approve" })}>Approve</Button>
                              <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: row.id, action: "reject" })}>Reject</Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
