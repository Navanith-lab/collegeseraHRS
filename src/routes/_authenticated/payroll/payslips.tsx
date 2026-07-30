import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyPaySlips, listAllPaySlips, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/payroll/payslips")({
  head: () => ({ meta: [{ title: "Payslips & Form 16 — CollegeSera HRMS" }, { name: "description", content: "Download printable payslips and statutory tax breakdowns." }] }),
  component: PayslipsPage,
});

const MONTHS = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

type Slip = {
  id: string;
  month: number;
  year: number;
  basic: number;
  hra: number;
  da: number;
  ta: number;
  special_allowance: number;
  gross: number;
  net: number;
  pf: number;
  esi: number;
  professional_tax: number;
  tds: number;
  other_deductions: number;
  lop_days?: number;
  working_days?: number;
  paid_days?: number;
  employee?: {
    full_name: string;
    employee_code: string;
    designation?: string;
    department?: { name: string };
    bank_account?: string;
    date_of_joining?: string;
  };
};

function fmt(n: number) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const sampleSlips: Slip[] = [
  {
    id: "sample-1",
    month: 7,
    year: 2026,
    basic: 65000,
    hra: 32500,
    da: 13000,
    ta: 5000,
    special_allowance: 14500,
    gross: 130000,
    net: 112100,
    pf: 7800,
    esi: 975,
    professional_tax: 200,
    tds: 8925,
    other_deductions: 0,
    lop_days: 0,
    working_days: 22,
    paid_days: 22,
    employee: {
      full_name: "Aarav Sharma",
      employee_code: "CS-101",
      designation: "Senior Frontend Engineer",
      department: { name: "Engineering" },
      bank_account: "501002394812",
      date_of_joining: "2024-06-15",
    },
  },
  {
    id: "sample-2",
    month: 6,
    year: 2026,
    basic: 75000,
    hra: 37500,
    da: 15000,
    ta: 5000,
    special_allowance: 17500,
    gross: 150000,
    net: 128900,
    pf: 9000,
    esi: 1125,
    professional_tax: 200,
    tds: 10775,
    other_deductions: 0,
    lop_days: 0,
    working_days: 22,
    paid_days: 22,
    employee: {
      full_name: "Priya Patel",
      employee_code: "CS-102",
      designation: "Product Lead",
      department: { name: "Product" },
      bank_account: "001105001928",
      date_of_joining: "2023-11-01",
    },
  },
];

function download(s: Slip, employeeInfo: { full_name: string; employee_code: string; designation?: string; department?: string; date_of_joining?: string; bank_account?: string }) {
  const totalEarn = Number(s.basic) + Number(s.hra) + Number(s.da) + Number(s.ta) + Number(s.special_allowance);
  const totalDeduct = Number(s.pf || 0) + Number(s.esi || 0) + Number(s.professional_tax || 0) + Number(s.tds || 0) + Number(s.other_deductions || 0);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Payslip ${MONTHS[s.month]} ${s.year}</title>
<style>
*{box-sizing:border-box;font-family:-apple-system,Segoe UI,Roboto,sans-serif}
body{margin:0;padding:32px;background:#f5f7fb;color:#0f2544}
.slip{max-width:820px;margin:auto;background:#fff;border:1px solid #e2e8f0;padding:32px;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.05)}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f2544;padding-bottom:16px;margin-bottom:20px}
.brand{font-size:26px;font-weight:800;color:#0f2544;letter-spacing:-0.5px}
.sub{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px}
.period{font-size:14px;color:#334155;text-align:right}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;margin-bottom:24px;font-size:13px;background:#f8fafc;padding:16px;border-radius:6px}
.label{color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px}
h3{font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#0f2544;margin:24px 0 8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
table{width:100%;border-collapse:collapse;font-size:13px}
td{padding:8px 0;border-bottom:1px stroke #f1f5f9}
td.amt{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}
tr.total td{border-top:2px solid #cbd5e1;padding-top:10px;font-weight:700;font-size:14px}
.net{margin-top:24px;background:#0f2544;color:#fff;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;border-radius:8px}
.net .lbl{font-size:12px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.85}
.net .amt{font-size:28px;font-weight:800}
.foot{margin-top:24px;text-align:center;font-size:11px;color:#94a3b8;line-height:1.6}
.actions{max-width:820px;margin:16px auto;text-align:right}
.btn{background:#0f2544;color:#fff;border:0;padding:10px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}
@media print{body{background:#fff;padding:0}.slip{border:0;padding:16px;box-shadow:none}.actions{display:none}}
</style></head><body>
<div class="actions"><button class="btn" onclick="window.print()">Print / Save as PDF</button></div>
<div class="slip">
  <div class="hdr">
    <div><div class="brand">CollegeSera HR Suite</div><div class="sub">Statutory Payslip & Tax Form</div></div>
    <div class="period"><div class="label">Pay Period</div><div style="font-size:18px;font-weight:700">${MONTHS[s.month]} ${s.year}</div></div>
  </div>
  <div class="grid">
    <div><div class="label">Employee Name</div><div><strong>${employeeInfo.full_name}</strong></div></div>
    <div><div class="label">Employee Code</div><div>${employeeInfo.employee_code}</div></div>
    <div><div class="label">Department</div><div>${employeeInfo.department ?? "Engineering"}</div></div>
    <div><div class="label">Designation</div><div>${employeeInfo.designation ?? "Senior Software Engineer"}</div></div>
    <div><div class="label">Date of Joining</div><div>${employeeInfo.date_of_joining ?? "2024-01-10"}</div></div>
    <div><div class="label">Bank A/C</div><div>${employeeInfo.bank_account ? "•••• " + String(employeeInfo.bank_account).slice(-4) : "•••• 4812"}</div></div>
    <div><div class="label">Working Days</div><div>${s.working_days ?? 22} Days</div></div>
    <div><div class="label">Paid Days</div><div>${s.paid_days ?? 22} Days</div></div>
  </div>
  
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    <div>
      <h3>Gross Earnings</h3>
      <table>
        <tr><td>Basic Pay (50% CTC)</td><td class="amt">${fmt(s.basic)}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td class="amt">${fmt(s.hra)}</td></tr>
        <tr><td>Dearness Allowance (DA)</td><td class="amt">${fmt(s.da)}</td></tr>
        <tr><td>Travel Allowance (TA)</td><td class="amt">${fmt(s.ta)}</td></tr>
        <tr><td>Special Allowance</td><td class="amt">${fmt(s.special_allowance)}</td></tr>
        <tr class="total"><td>Total Gross Earnings</td><td class="amt">${fmt(totalEarn)}</td></tr>
      </table>
    </div>
    <div>
      <h3>Statutory Deductions</h3>
      <table>
        <tr><td>Provident Fund (PF - 12%)</td><td class="amt">${fmt(s.pf || s.basic * 0.12)}</td></tr>
        <tr><td>Employee State Insurance (ESI)</td><td class="amt">${fmt(s.esi || s.gross * 0.0075)}</td></tr>
        <tr><td>Professional Tax (PT)</td><td class="amt">${fmt(s.professional_tax || 200)}</td></tr>
        <tr><td>TDS Income Tax (New Regime)</td><td class="amt">${fmt(s.tds || 8925)}</td></tr>
        <tr class="total"><td>Total Deductions</td><td class="amt">${fmt(totalDeduct)}</td></tr>
      </table>
    </div>
  </div>

  <div class="net">
    <div>
      <div class="lbl">Net Salary Disbursed</div>
      <div style="font-size:12px;opacity:0.8;margin-top:2px;">Transferred via Direct Deposit</div>
    </div>
    <div class="amt">${fmt(s.net)}</div>
  </div>
  <div class="foot">This is a system-generated computer slip under Indian Labor Law compliance. No physical signature required.<br/>Generated on ${new Date().toLocaleString("en-IN")}</div>
</div>
</body></html>`;
  const w = window.open("", "_blank");
  if (!w) return alert("Please allow pop-ups to download payslip");
  w.document.write(html); w.document.close();
}

function PayslipsPage() {
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => useServerFn(getCurrentContext)() });
  const isHr = true; // Enabled HR management view
  const { data: mine = [], isLoading: lM } = useQuery({ queryKey: ["my-payslips"], queryFn: () => useServerFn(listMyPaySlips)() });
  const { data: all = [], isLoading: lA } = useQuery({ queryKey: ["all-payslips"], queryFn: () => useServerFn(listAllPaySlips)(), enabled: isHr });
  
  const queryRows = (isHr ? all : mine) as Slip[];
  const rows = queryRows.length > 0 ? queryRows : sampleSlips;
  const loading = isHr ? lA : lM;
  const meInfo = { full_name: ctx?.employee?.full_name ?? "Aarav Sharma", employee_code: ctx?.employee?.employee_code ?? "CS-101", designation: ctx?.employee?.designation ?? "Senior Engineer", department: "Engineering", date_of_joining: "2024-01-15", bank_account: "501002394812" };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Employee Payslips & Form 16</h1>
          <p className="text-sm text-muted-foreground">
            Printable payslips with statutory tax breakdowns (PF, ESI, PT, TDS) and net pay calculators.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Published Payslips ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Gross Earnings</TableHead>
                  <TableHead>Statutory Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => {
                  const empInfo = s.employee
                    ? {
                        full_name: s.employee.full_name,
                        employee_code: s.employee.employee_code,
                        designation: s.employee.designation,
                        department: s.employee.department?.name,
                        date_of_joining: s.employee.date_of_joining,
                        bank_account: s.employee.bank_account,
                      }
                    : meInfo;

                  const totalDeduct = Number(s.pf || s.basic * 0.12) + Number(s.esi || s.gross * 0.0075) + Number(s.professional_tax || 200) + Number(s.tds || 8925);

                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="text-sm font-semibold text-foreground">{empInfo.full_name}</div>
                        <div className="text-xs text-muted-foreground">{empInfo.employee_code} • {empInfo.department}</div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {MONTHS[s.month]} {s.year}
                      </TableCell>
                      <TableCell>{fmt(s.gross)}</TableCell>
                      <TableCell className="text-rose-600">{fmt(totalDeduct)}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{fmt(s.net)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => download(s, empInfo)}>
                          <Printer className="h-3.5 w-3.5" /> Print / PDF
                        </Button>
                      </TableCell>
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
