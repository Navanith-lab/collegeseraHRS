import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listMyDocuments, listAllDocuments, uploadEmployeeDocument, verifyDocument, getCurrentContext, listEmployees } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Upload, AlertTriangle, ShieldCheck, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — CollegeSera HRMS" }, { name: "description", content: "Personal document vault with verification workflow." }] }),
  component: DocumentsPage,
});

const DOC_TYPES = ["PAN Card","Aadhaar Card","Degree Certificate","Experience Letter","Offer Letter","Appointment Order","Relieving Letter","Bank Statement","Medical Certificate","Passport","Other"];
const MANDATORY = ["PAN Card", "Aadhaar Card", "Degree Certificate"];

type Doc = { id: string; category: string; name: string; file_url: string; verification_status?: string; issued_date?: string; expiry_date?: string; rejection_reason?: string; employee_id: string; employee?: { full_name: string; employee_code: string } };

const badge = (s?: string) => {
  const cfg: Record<string, string> = { verified: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-800", expired: "bg-amber-100 text-amber-800" };
  return cfg[s ?? "unverified"] ?? "bg-gray-100 text-gray-700";
};

function DocumentsPage() {
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Documents</h1><p className="text-sm text-muted-foreground">Manage and verify employee documents.</p></div>
      <Tabs defaultValue="mine">
        <TabsList><TabsTrigger value="mine">My Documents</TabsTrigger>{isHr && <TabsTrigger value="verify">HR Verification</TabsTrigger>}</TabsList>
        <TabsContent value="mine" className="mt-4"><MyDocs /></TabsContent>
        {isHr && <TabsContent value="verify" className="mt-4"><VerifyPanel /></TabsContent>}
      </Tabs>
    </div>
  );
}

function MyDocs() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["my-docs"], queryFn: () => useServerFn(listMyDocuments)() });
  const docs = data as Doc[];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "PAN Card", name: "", file_url: "", issued_date: "", expiry_date: "" });
  const up = useMutation({ mutationFn: () => useServerFn(uploadEmployeeDocument)({ data: form }), onSuccess: () => { toast.success("Uploaded"); setOpen(false); qc.invalidateQueries({ queryKey: ["my-docs"] }); }, onError: (e: Error) => toast.error(e.message) });

  const uploaded = new Set(docs.map((d) => d.category));
  const missing = MANDATORY.filter((m) => !uploaded.has(m));
  const now = Date.now(); const in30 = now + 30 * 24 * 60 * 60 * 1000;
  const expiring = docs.filter((d) => d.expiry_date && new Date(d.expiry_date).getTime() > now && new Date(d.expiry_date).getTime() < in30);

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <Card className="border-amber-300 bg-amber-50"><CardContent className="flex items-center gap-3 py-3"><AlertTriangle className="h-5 w-5 text-amber-700" /><div className="flex-1 text-sm"><span className="font-semibold text-amber-800">Missing mandatory documents:</span> {missing.join(", ")}</div></CardContent></Card>
      )}
      {expiring.length > 0 && (
        <Card className="border-orange-300 bg-orange-50"><CardContent className="flex items-center gap-3 py-3"><AlertTriangle className="h-5 w-5 text-orange-700" /><div className="text-sm"><span className="font-semibold text-orange-800">Expiring within 30 days:</span> {expiring.map(d => d.name).join(", ")}</div></CardContent></Card>
      )}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" />Upload Document</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Type</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
              <div><Label>Title</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>File URL</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://…" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Issued Date</Label><Input type="date" value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></div>
                <div><Label>Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter><Button onClick={() => up.mutate()} disabled={up.isPending || !form.name || !form.file_url}>Upload</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-32"/>)}</div> :
       docs.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-2 py-12"><FileText className="h-8 w-8 text-muted-foreground"/><div className="text-sm text-muted-foreground">No documents uploaded</div></CardContent></Card> :
       <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{docs.map(d => (
         <Card key={d.id}>
           <CardContent className="p-4">
             <div className="mb-2 flex items-start justify-between gap-2"><FileText className="h-6 w-6 text-primary" /><Badge className={badge(d.verification_status)}>{d.verification_status ?? "unverified"}</Badge></div>
             <div className="text-xs font-medium text-muted-foreground">{d.category}</div>
             <div className="text-sm font-semibold">{d.name}</div>
             {(d.issued_date || d.expiry_date) && <div className="mt-1 text-xs text-muted-foreground">{d.issued_date && `Issued ${d.issued_date}`}{d.expiry_date && ` · Expires ${d.expiry_date}`}</div>}
             {d.rejection_reason && <div className="mt-2 text-xs text-red-700">Rejected: {d.rejection_reason}</div>}
             <div className="mt-3"><a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary underline">View / Download</a></div>
           </CardContent>
         </Card>
       ))}</div>
      }
    </div>
  );
}

function VerifyPanel() {
  const qc = useQueryClient();
  const { data: emps = [] } = useQuery({ queryKey: ["employees"], queryFn: () => useServerFn(listEmployees)() });
  const { data: all = [] } = useQuery({ queryKey: ["all-docs"], queryFn: () => useServerFn(listAllDocuments)() });
  const [selected, setSelected] = useState<string>("");
  const [rej, setRej] = useState<{ id: string; reason: string } | null>(null);
  const verify = useMutation({ mutationFn: (v: { id: string; status: "verified" | "rejected"; rejection_reason?: string }) => useServerFn(verifyDocument)({ data: v }), onSuccess: () => { toast.success("Updated"); setRej(null); qc.invalidateQueries({ queryKey: ["all-docs"] }); }, onError: (e: Error) => toast.error(e.message) });

  const empDocs = (all as Doc[]).filter((d) => !selected || d.employee_id === selected);
  const employeeName = (emps as Array<{id:string;full_name:string}>).find((e) => e.id === selected)?.full_name;
  const uploaded = new Set(empDocs.map(d => d.category));
  const missing = selected ? MANDATORY.filter(m => !uploaded.has(m)) : [];

  return (
    <div className="space-y-4">
      <Card><CardContent className="flex items-center gap-3 p-4"><ShieldCheck className="h-5 w-5 text-primary" /><Select value={selected} onValueChange={setSelected}><SelectTrigger className="max-w-sm"><SelectValue placeholder="Select employee to verify" /></SelectTrigger><SelectContent>{(emps as Array<{id:string;full_name:string;employee_code:string}>).map(e => <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>)}</SelectContent></Select></CardContent></Card>
      {selected && missing.length > 0 && <Card className="border-amber-300 bg-amber-50"><CardContent className="py-3 text-sm text-amber-800">{employeeName} is missing: {missing.join(", ")}</CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{empDocs.map(d => (
        <Card key={d.id}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between"><div><div className="text-xs text-muted-foreground">{d.category}</div><div className="text-sm font-semibold">{d.name}</div>{!selected && <div className="text-xs text-muted-foreground">{d.employee?.full_name}</div>}</div><Badge className={badge(d.verification_status)}>{d.verification_status ?? "unverified"}</Badge></div>
            <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">View file</a>
            {d.rejection_reason && <div className="mt-2 text-xs text-red-700">Reason: {d.rejection_reason}</div>}
            {d.verification_status !== "verified" && (
              <div className="mt-3 flex gap-2"><Button size="sm" onClick={() => verify.mutate({ id: d.id, status: "verified" })}>Verify</Button><Button size="sm" variant="destructive" onClick={() => setRej({ id: d.id, reason: "" })}>Reject</Button></div>
            )}
          </CardContent>
        </Card>
      ))}</div>
      <Dialog open={!!rej} onOpenChange={(o) => !o && setRej(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject document</DialogTitle></DialogHeader>
          <Textarea rows={3} placeholder="Reason" value={rej?.reason ?? ""} onChange={(e) => setRej(rej ? { ...rej, reason: e.target.value } : null)} />
          <DialogFooter><Button variant="destructive" onClick={() => rej && verify.mutate({ id: rej.id, status: "rejected", rejection_reason: rej.reason })}>Reject</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
