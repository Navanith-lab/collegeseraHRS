import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyPaySlips, listAllPaySlips, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payroll/payslips")({
  head: () => ({ meta: [{ title: "Payslips — CollegeSera HRMS" }, { name: "description", content: "Download printable payslips." }] }),
  component: PayslipsPage,
});

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

type Slip = { id: string; month: number; year: number; basic: number; hra: number; da: number; ta: number; special_allowance: number; gross: number; net: number; professional_tax: number; other_deductions: number; lop_days?: number; working_days?: number; paid_days?: number; employee?: { full_name: string; employee_code: string; designation?: string; department?: { name: string }; bank_account?: string; date_of_joining?: string } };

function fmt(n: number) { return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

function download(s: Slip, employeeInfo: { full_name: string; employee_code: string; designation?: string; department?: string; date_of_joining?: string; bank_account?: string }) {
  const totalEarn = Number(s.basic) + Number(s.hra) + Number(s.da) + Number(s.ta) + Number(s.special_allowance);
  const lop = Number(s.other_deductions) + Number(s.professional_tax);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip ${MONTHS[s.month]} ${s.year}</title>
<style>
*{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
body{margin:0;padding:32px;background:#f5f7fb;color:#0f2544}
.slip{max-width:820px;margin:auto;background:#fff;border:1px solid #e2e8f0;padding:32px}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f2544;padding-bottom:16px;margin-bottom:20px}
.brand{font-size:24px;font-weight:800;color:#0f2544;letter-spacing:-0.5px}
.sub{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.period{font-size:14px;color:#334155;text-align:right}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:24px;font-size:13px}
.label{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#0f2544;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:6px 0}
td.amt{text-align:right;font-variant-numeric:tabular-nums}
tr.total td{border-top:1px solid #cbd5e1;padding-top:8px;font-weight:700}
.net{margin-top:24px;background:#0f2544;color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center;border-radius:6px}
.net .lbl{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.85}
.net .amt{font-size:28px;font-weight:800}
.foot{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8;line-height:1.6}
.actions{max-width:820px;margin:16px auto;text-align:right}
.btn{background:#0f2544;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}
@media print{body{background:#fff;padding:0}.slip{border:0;padding:16px}.actions{display:none}}
</style></head><body>
<div class="actions"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
<div class="slip">
  <div class="hdr">
    <div><div class="brand">CollegeSera</div><div class="sub">Human Resource Management</div></div>
    <div class="period"><div class="label">Pay Period</div><div style="font-size:18px;font-weight:700">${MONTHS[s.month]} ${s.year}</div></div>
  </div>
  <div class="grid">
    <div><div class="label">Employee</div><div><strong>${employeeInfo.full_name}</strong></div></div>
    <div><div class="label">Employee Code</div><div>${employeeInfo.employee_code}</div></div>
    <div><div class="label">Department</div><div>${employeeInfo.department ?? "—"}</div></div>
    <div><div class="label">Designation</div><div>${employeeInfo.designation ?? "—"}</div></div>
    <div><div class="label">Date of Joining</div><div>${employeeInfo.date_of_joining ?? "—"}</div></div>
    <div><div class="label">Bank A/C</div><div>${employeeInfo.bank_account ? "•••• " + String(employeeInfo.bank_account).slice(-4) : "—"}</div></div>
    <div><div class="label">Working Days</div><div>${s.working_days ?? 26}</div></div>
    <div><div class="label">Paid Days</div><div>${s.paid_days ?? 26}</div></div>
  </div>
  <h3>Earnings</h3>
  <table>
    <tr><td>Basic Salary</td><td class="amt">${fmt(s.basic)}</td></tr>
    <tr><td>House Rent Allowance (HRA)</td><td class="amt">${fmt(s.hra)}</td></tr>
    <tr><td>Dearness Allowance (DA)</td><td class="amt">${fmt(s.da)}</td></tr>
    <tr><td>Travel Allowance (TA)</td><td class="amt">${fmt(s.ta)}</td></tr>
    <tr><td>Special Allowance</td><td class="amt">${fmt(s.special_allowance)}</td></tr>
    <tr class="total"><td>Total Earnings (Gross)</td><td class="amt">${fmt(totalEarn)}</td></tr>
  </table>
  <h3>Deductions</h3>
  <table>
    <tr><td>Professional Tax</td><td class="amt">${fmt(s.professional_tax)}</td></tr>
    <tr><td>Other Deductions${(s.lop_days ?? 0) > 0 ? ` (incl. ${s.lop_days} LOP days)` : ""}</td><td class="amt">${fmt(s.other_deductions)}</td></tr>
    <tr class="total"><td>Total Deductions</td><td class="amt">${fmt(lop)}</td></tr>
  </table>
  <div class="net"><div class="lbl">Net Pay</div><div class="amt">${fmt(s.net)}</div></div>
  <div class="foot">This is a computer-generated payslip. No signature required.<br/>Generated on ${new Date().toLocaleString("en-IN")}</div>
</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return alert("Please allow pop-ups to download payslip");
  w.document.write(html); w.document.close();
}

function PayslipsPage() {
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = !!ctx?.roles?.some((r) => r === "hr_admin" || r === "super_admin");
  const { data: mine = [], isLoading: lM } = useQuery({ queryKey: ["my-payslips"], queryFn: () => useServerFn(listMyPaySlips)() });
  const { data: all = [], isLoading: lA } = useQuery({ queryKey: ["all-payslips"], queryFn: () => useServerFn(listAllPaySlips)(), enabled: isHr });
  const rows = (isHr ? all : mine) as Slip[];
  const loading = isHr ? lA : lM;
  const meInfo = { full_name: ctx?.employee?.full_name ?? "", employee_code: ctx?.employee?.employee_code ?? "", designation: ctx?.employee?.designation ?? undefined, department: undefined, date_of_joining: ctx?.employee?.date_of_joining ?? undefined, bank_account: ctx?.employee?.bank_account ?? undefined };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pay Slips</h1><p className="text-sm text-muted-foreground">{isHr ? "All company payslips." : "Your payslip history."}</p></div>
      <Card>
        <CardHeader><CardTitle className="text-base">{rows.length} slips</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-10 w-full"/>)}</div> :
           rows.length === 0 ? <div className="flex flex-col items-center gap-2 py-12"><FileText className="h-8 w-8 text-muted-foreground"/><div className="text-sm text-muted-foreground">No payslips available</div></div> :
            <Table>
              <TableHeader><TableRow>{isHr && <TableHead>Employee</TableHead>}<TableHead>Period</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead></TableHead></TableRow></TableHeader>
              <TableBody>{rows.map(s => {
                const empInfo = s.employee ? { full_name: s.employee.full_name, employee_code: s.employee.employee_code, designation: s.employee.designation, department: s.employee.department?.name, date_of_joining: s.employee.date_of_joining, bank_account: s.employee.bank_account } : meInfo;
                return (
                  <TableRow key={s.id}>
                    {isHr && <TableCell><div className="text-sm font-medium">{s.employee?.full_name}</div><div className="text-xs text-muted-foreground">{s.employee?.employee_code}</div></TableCell>}
                    <TableCell>{MONTHS[s.month]} {s.year}</TableCell>
                    <TableCell>{fmt(s.gross)}</TableCell>
                    <TableCell>{fmt(Number(s.professional_tax) + Number(s.other_deductions))}</TableCell>
                    <TableCell className="font-semibold">{fmt(s.net)}</TableCell>
                    <TableCell><Button size="sm" variant="outline" onClick={() => download(s, empInfo)}><Download className="mr-1 h-3 w-3" />Download</Button></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          }
        </CardContent>
      </Card>
    </div>
  );
}
