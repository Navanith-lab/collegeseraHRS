import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentContext, updateMyProfile, getMyLeaveBalance, listLeaves, listMyPaySlips, listMyDocuments } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Download, FileText, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — CollegeSera HRMS" }, { name: "description", content: "Self-service employee profile." }] }),
  component: ProfilePage,
});

const MONTHS = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const mask = (s?: string) => s ? "•••• " + s.slice(-4) : "";

function ProfilePage() {
  const qc = useQueryClient();
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const doSave = useServerFn(updateMyProfile);
  const [personal, setPersonal] = useState({ full_name: "", phone: "", emergency_contact_name: "", emergency_contact_phone: "" });
  const [bank, setBank] = useState({ bank_name: "", bank_account: "", bank_ifsc: "", pan: "" });

  useEffect(() => {
    if (!ctx) return;
    setPersonal({ full_name: ctx.profile?.full_name ?? "", phone: ctx.profile?.phone ?? "", emergency_contact_name: ctx.employee?.emergency_contact_name ?? "", emergency_contact_phone: ctx.employee?.emergency_contact_phone ?? "" });
    setBank({ bank_name: ctx.employee?.bank_name ?? "", bank_account: ctx.employee?.bank_account ?? "", bank_ifsc: ctx.employee?.bank_ifsc ?? "", pan: ctx.employee?.pan ?? "" });
  }, [ctx]);

  const savePersonal = useMutation({ mutationFn: () => doSave({ data: { ...personal, ...bank, aadhaar: ctx?.employee?.aadhaar ?? "" } }), onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["current-context"] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Profile</h1><p className="text-sm text-muted-foreground">Manage your information, view payslips, leave and documents.</p></div>
      <Tabs defaultValue="personal">
        <TabsList className="flex-wrap"><TabsTrigger value="personal">Personal</TabsTrigger><TabsTrigger value="work">Work</TabsTrigger><TabsTrigger value="bank">Bank & Tax</TabsTrigger><TabsTrigger value="leave">Leave</TabsTrigger><TabsTrigger value="payslips">Payslips</TabsTrigger><TabsTrigger value="docs">Documents</TabsTrigger></TabsList>

        <TabsContent value="personal" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Personal Info</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Full name</Label><Input value={personal.full_name} onChange={(e) => setPersonal({ ...personal, full_name: e.target.value })} /></div>
            <div><Label>Phone</Label><Input value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} /></div>
            <div><Label>Email</Label><Input disabled value={ctx?.profile?.email ?? ""} /></div>
            <div><Label>Employee Code</Label><Input disabled value={ctx?.employee?.employee_code ?? "—"} /></div>
            <div><Label>Emergency contact name</Label><Input value={personal.emergency_contact_name} onChange={(e) => setPersonal({ ...personal, emergency_contact_name: e.target.value })} /></div>
            <div><Label>Emergency contact phone</Label><Input value={personal.emergency_contact_phone} onChange={(e) => setPersonal({ ...personal, emergency_contact_phone: e.target.value })} /></div>
          </CardContent></Card>
          <div className="flex justify-end"><Button onClick={() => savePersonal.mutate()} disabled={savePersonal.isPending}>Save changes</Button></div>
        </TabsContent>

        <TabsContent value="work" className="mt-4">
          <Card><CardHeader><CardTitle className="text-base">Work Info</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
            <Info label="Designation" value={ctx?.employee?.designation ?? "—"} />
            <Info label="Employee Code" value={ctx?.employee?.employee_code ?? "—"} />
            <Info label="Date of Joining" value={ctx?.employee?.date_of_joining ?? "—"} />
            <Info label="Employment Type" value={ctx?.employee?.employment_type ?? "—"} />
            <Info label="Status" value={ctx?.employee?.status ?? "—"} />
            <Info label="Email" value={ctx?.employee?.email ?? "—"} />
          </CardContent></Card>
          <p className="mt-3 text-xs text-muted-foreground">Contact HR to update work information.</p>
        </TabsContent>

        <TabsContent value="bank" className="mt-4 space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Bank & Tax</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
            <div><Label>Bank Name</Label><Input value={bank.bank_name} onChange={(e) => setBank({ ...bank, bank_name: e.target.value })} /></div>
            <div><Label>Account Number</Label><Input value={bank.bank_account} onChange={(e) => setBank({ ...bank, bank_account: e.target.value })} placeholder={mask(ctx?.employee?.bank_account ?? undefined)} /></div>
            <div><Label>IFSC</Label><Input value={bank.bank_ifsc} onChange={(e) => setBank({ ...bank, bank_ifsc: e.target.value })} /></div>
            <div><Label>PAN</Label><Input value={bank.pan} onChange={(e) => setBank({ ...bank, pan: e.target.value })} /></div>
          </CardContent></Card>
          <div className="flex justify-end"><Button onClick={() => savePersonal.mutate()} disabled={savePersonal.isPending}>Save changes</Button></div>
        </TabsContent>

        <TabsContent value="leave" className="mt-4"><LeaveTab /></TabsContent>
        <TabsContent value="payslips" className="mt-4"><PayslipsTab /></TabsContent>
        <TabsContent value="docs" className="mt-4"><DocsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="font-medium">{value}</div></div>; }

function LeaveTab() {
  const { data: bal, isLoading } = useQuery({ queryKey: ["my-leave-balance"], queryFn: () => useServerFn(getMyLeaveBalance)() });
  const { data: allLeaves = [] } = useQuery({ queryKey: ["all-leaves"], queryFn: () => useServerFn(listLeaves)() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const mine = (allLeaves as Array<{id:string;leave_type:string;start_date:string;end_date:string;days:number;status:string;employee_id:string}>).filter(l => l.employee_id === ctx?.employee?.id).slice(0, 5);
  if (isLoading) return <Skeleton className="h-40" />;
  const types = bal ? [
    { name: "Casual", used: Number(bal.casual_used), total: Number(bal.casual_total) },
    { name: "Sick", used: Number(bal.sick_used), total: Number(bal.sick_total) },
    { name: "Privilege", used: Number(bal.privilege_used), total: Number(bal.privilege_total) },
    { name: "WFH", used: Number(bal.wfh_used), total: Number(bal.wfh_total) },
    { name: "Comp Off", used: Number(bal.comp_off_used), total: Number(bal.comp_off_total) },
  ] : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><div className="font-semibold text-sm">Leave Balance ({new Date().getFullYear()})</div><Link to="/leaves"><Button size="sm">Apply Leave</Button></Link></div>
      {!bal ? <Card><CardContent className="py-6 text-sm text-muted-foreground">No leave balance configured. Ask HR.</CardContent></Card> :
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{types.map(t => { const rem = t.total - t.used; const pct = t.total ? (t.used / t.total) * 100 : 0; return (
          <Card key={t.name}><CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{t.name}</span><span className="text-xs text-muted-foreground">{rem} / {t.total} left</span></div>
            <Progress value={pct} />
          </CardContent></Card>
        );})}</div>}
      <Card><CardHeader><CardTitle className="text-sm">Last 5 requests</CardTitle></CardHeader><CardContent className="space-y-1">
        {mine.length === 0 ? <div className="text-sm text-muted-foreground">No leave requests yet</div> :
          mine.map(l => <div key={l.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm"><span className="capitalize">{l.leave_type} · {l.start_date} → {l.end_date} ({l.days}d)</span><Badge variant="outline">{l.status}</Badge></div>)}
      </CardContent></Card>
    </div>
  );
}

function PayslipsTab() {
  const { data: slips = [], isLoading } = useQuery({ queryKey: ["my-payslips"], queryFn: () => useServerFn(listMyPaySlips)() });
  if (isLoading) return <Skeleton className="h-40" />;
  const rows = (slips as Array<{id:string;month:number;year:number;gross:number;net:number;professional_tax:number;other_deductions:number;payroll_run?:{status:string}}>).slice(0, 6);
  if (rows.length === 0) return <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No payslips available yet</CardContent></Card>;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map(s => (
      <Card key={s.id}><CardContent className="p-4">
        <div className="mb-1 text-xs text-muted-foreground">{MONTHS[s.month]} {s.year}</div>
        <div className="text-xs">Gross ₹{Number(s.gross).toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">Deductions ₹{(Number(s.professional_tax) + Number(s.other_deductions)).toLocaleString()}</div>
        <div className="mt-2 text-lg font-bold">₹{Number(s.net).toLocaleString()}</div>
        <div className="mt-2 flex items-center justify-between"><Badge variant="outline" className="text-[10px]">{s.payroll_run?.status ?? "—"}</Badge><Link to="/payroll/payslips"><Button size="sm" variant="outline"><Download className="mr-1 h-3 w-3" />Open</Button></Link></div>
      </CardContent></Card>
    ))}</div>
  );
}

function DocsTab() {
  const { data: docs = [], isLoading } = useQuery({ queryKey: ["my-docs"], queryFn: () => useServerFn(listMyDocuments)() });
  if (isLoading) return <Skeleton className="h-40" />;
  const rows = docs as Array<{id:string;name:string;category:string;file_url:string;verification_status?:string}>;
  const uploaded = new Set(rows.map(d => d.category));
  const missing = ["PAN Card", "Aadhaar Card"].filter(m => !uploaded.has(m));
  return (
    <div className="space-y-3">
      {missing.length > 0 && <Card className="border-amber-300 bg-amber-50"><CardContent className="flex items-center gap-2 py-3 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" />Missing: {missing.join(", ")}</CardContent></Card>}
      <div className="flex justify-end"><Link to="/documents"><Button size="sm"><Upload className="mr-1 h-3 w-3" />Upload</Button></Link></div>
      {rows.length === 0 ? <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No documents uploaded</CardContent></Card> :
        <div className="grid gap-2 sm:grid-cols-2">{rows.map(d => (
          <div key={d.id} className="flex items-center justify-between rounded border p-3">
            <div className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4 text-primary" /><div><div className="font-medium">{d.name}</div><div className="text-xs text-muted-foreground">{d.category}</div></div></div>
            <div className="flex items-center gap-2"><Badge variant="outline">{d.verification_status ?? "unverified"}</Badge><a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Open</a></div>
          </div>
        ))}</div>}
    </div>
  );
}
