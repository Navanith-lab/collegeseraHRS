import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAssets, createAsset, assignAsset, listEmployees, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assets")({
  head: () => ({ meta: [{ title: "Assets — CollegeSera HRMS" }] }),
  component: AssetsPage,
});

function AssetsPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ["assets"], queryFn: () => useServerFn(listAssets)() });
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: () => useServerFn(listEmployees)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const canManage = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const doCreate = useServerFn(createAsset);
  const doAssign = useServerFn(assignAsset);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ asset_code: "", name: "", category: "laptop", brand: "", model: "", serial_number: "" });
  const [assignId, setAssignId] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState("");

  const create = useMutation({
    mutationFn: () => doCreate({ data: form }),
    onSuccess: () => { toast.success("Asset added"); qc.invalidateQueries({ queryKey: ["assets"] }); setOpen(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const assign = useMutation({
    mutationFn: () => doAssign({ data: { id: assignId!, employee_id: assignTo } }),
    onSuccess: () => { toast.success("Assigned"); qc.invalidateQueries({ queryKey: ["assets"] }); setAssignId(null); },
    onError: (e: Error) => toast.error(e.message),
  });

  const badge = (s: string) => s === "assigned" ? "default" : s === "available" ? "secondary" : "outline";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Assets</h1>
          <p className="text-sm text-muted-foreground">Track company-issued equipment.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add asset</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New asset</DialogTitle></DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><Label>Code</Label><Input value={form.asset_code} onChange={(e) => setForm({ ...form, asset_code: e.target.value })} /></div>
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>Brand</Label><Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
                <div><Label>Serial #</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={() => create.mutate()} disabled={!form.asset_code || !form.name}>Save</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} assets</CardTitle></CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12"><Package className="h-8 w-8 text-muted-foreground" /><div className="text-sm text-muted-foreground">No assets yet</div></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead>{canManage && <TableHead>Actions</TableHead>}</TableRow></TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell><div className="text-sm font-medium">{a.name}</div><div className="text-xs text-muted-foreground">{a.brand} {a.model}</div></TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell><Badge variant={badge(a.status)}>{a.status.replace("_"," ")}</Badge></TableCell>
                    {canManage && (
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => setAssignId(a.id)}>Assign</Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!assignId} onOpenChange={(o) => !o && setAssignId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign asset</DialogTitle></DialogHeader>
          <div><Label>Employee</Label>
            <Select value={assignTo} onValueChange={setAssignTo}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{emps.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter><Button onClick={() => assign.mutate()} disabled={!assignTo}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
