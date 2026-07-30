import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Search, FileSpreadsheet, Lock, UserCog, Database } from "lucide-react";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  component: AuditLogsPage,
});

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  module: "Auth" | "Payroll" | "Employees" | "Role & RBAC" | "Attendance" | "Settings";
  ipAddress: string;
  status: "Success" | "Warning" | "Denied";
}

const initialLogs: AuditLog[] = [
  { id: "1", timestamp: "2026-07-30 11:42:05", user: "Admin User", role: "Super Admin", action: "Executed Payroll Run Q2 2026", module: "Payroll", ipAddress: "192.168.1.26", status: "Success" },
  { id: "2", timestamp: "2026-07-30 10:15:12", user: "HR Manager", role: "HR Admin", action: "Promoted 'Aarav Sharma' to Team Lead", module: "Employees", ipAddress: "192.168.1.45", status: "Success" },
  { id: "3", timestamp: "2026-07-30 09:05:44", user: "System Guard", role: "Security Bot", action: "Failed Password Attempt for user 'guest@corp.com'", module: "Auth", ipAddress: "49.207.18.2", status: "Denied" },
  { id: "4", timestamp: "2026-07-29 16:20:10", user: "Finance Lead", role: "Finance Admin", action: "Exported Bank Disbursement File (HDFC Batch #8812)", module: "Payroll", ipAddress: "192.168.1.18", status: "Success" },
  { id: "5", timestamp: "2026-07-29 14:02:30", user: "Admin User", role: "Super Admin", action: "Updated Role Permission Matrix (Added Travel Approver)", module: "Role & RBAC", ipAddress: "192.168.1.26", status: "Success" },
  { id: "6", timestamp: "2026-07-29 08:30:00", user: "Aarav Sharma", role: "Employee", action: "Submitted Punch Regularisation Request", module: "Attendance", ipAddress: "114.143.12.89", status: "Success" },
];

function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress.includes(searchTerm);
    const matchesModule = moduleFilter === "all" || l.module === moduleFilter;
    const matchesStatus = statusFilter === "all" || l.status === statusFilter;
    return matchesSearch && matchesModule && matchesStatus;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Security & Admin Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Immutable system logs tracking role updates, salary modifications, data exports, and auth events for enterprise compliance.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Logged Admin Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">1,248</div>
            <p className="mt-1 text-xs text-muted-foreground">100% Audit Compliance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Role & RBAC Edits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="mt-1 text-xs text-muted-foreground">Permissions audit clean</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payroll Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">38</div>
            <p className="mt-1 text-xs text-muted-foreground">Bank batch files generated</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Auth Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">1</div>
            <p className="mt-1 text-xs text-muted-foreground">Blocked by Rate Limiter</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>System Activity Logs</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user, action, IP..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Module" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="Payroll">Payroll</SelectItem>
                  <SelectItem value="Employees">Employees</SelectItem>
                  <SelectItem value="Auth">Auth</SelectItem>
                  <SelectItem value="Role & RBAC">Role & RBAC</SelectItem>
                  <SelectItem value="Attendance">Attendance</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Success">Success</SelectItem>
                  <SelectItem value="Warning">Warning</SelectItem>
                  <SelectItem value="Denied">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y rounded-md border">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-3 p-4 hover:bg-muted/30 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{log.timestamp}</span>
                    <Badge variant="outline">{log.module}</Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{log.action}</h4>
                  <p className="text-xs text-muted-foreground">
                    Triggered by: <span className="font-medium text-foreground">{log.user}</span> ({log.role}) • IP: <span className="font-mono text-foreground">{log.ipAddress}</span>
                  </p>
                </div>

                <Badge
                  className={
                    log.status === "Success"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                      : log.status === "Warning"
                      ? "bg-amber-500/10 text-amber-600 border-amber-200"
                      : "bg-rose-500/10 text-rose-600 border-rose-200"
                  }
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
