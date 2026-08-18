import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentContext, listEmployees } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, UserCheck, Lock, Building2, Clock, CheckCircle2, Search, Sliders, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Admin Panel & RBAC Permissions — KollegeApply HRMS" }] }),
});

interface RolePermission {
  module: string;
  superAdmin: boolean;
  hrAdmin: boolean;
  financeMgr: boolean;
  teamLead: boolean;
  employee: boolean;
}

const initialPermissions: RolePermission[] = [
  { module: "Core HR & Directory", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: true, employee: true },
  { module: "Employee Onboarding Checklist", superAdmin: true, hrAdmin: true, financeMgr: false, teamLead: false, employee: false },
  { module: "Attendance Clock In & Geo-Fence", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: true, employee: true },
  { module: "Punch Regularization Approval", superAdmin: true, hrAdmin: true, financeMgr: false, teamLead: true, employee: false },
  { module: "Payroll Run Execution Wizard", superAdmin: true, hrAdmin: false, financeMgr: true, teamLead: false, employee: false },
  { module: "Bank Batch CSV Export", superAdmin: true, hrAdmin: false, financeMgr: true, teamLead: false, employee: false },
  { module: "Payslip Downloads (Own Only)", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: true, employee: true },
  { module: "Recruitment ATS Kanban & Offers", superAdmin: true, hrAdmin: true, financeMgr: false, teamLead: false, employee: false },
  { module: "Weighted OKRs & KRAs", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: true, employee: true },
  { module: "360 Appraisals & 9-Box Grid", superAdmin: true, hrAdmin: true, financeMgr: false, teamLead: true, employee: false },
  { module: "HR Helpdesk SLA Resolution", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: true, employee: false },
  { module: "Multi-Dept Exit Clearance & FnF", superAdmin: true, hrAdmin: true, financeMgr: true, teamLead: false, employee: false },
  { module: "Security Audit Logs & Roles", superAdmin: true, hrAdmin: false, financeMgr: false, teamLead: false, employee: false },
];

interface UserRoleItem {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "hr_admin" | "finance_mgr" | "manager" | "employee";
  department: string;
}

const initialUsers: UserRoleItem[] = [
  { id: "u1", name: "Navaneetha", email: "navaneetha@kollegeapply.com", role: "super_admin", department: "Executive" },
  { id: "u2", name: "Aarav Sharma", email: "aarav.sharma@kollegeapply.com", role: "manager", department: "Engineering" },
  { id: "u3", name: "Priya Patel", email: "priya.patel@kollegeapply.com", role: "hr_admin", department: "Human Resources" },
  { id: "u4", name: "Rohan Verma", email: "rohan.verma@kollegeapply.com", role: "finance_mgr", department: "Finance" },
  { id: "u5", name: "Neha Gupta", email: "neha.gupta@kollegeapply.com", role: "employee", department: "Marketing" },
];

function SettingsPage() {
  const [permissions, setPermissions] = useState<RolePermission[]>(initialPermissions);
  const [users, setUsers] = useState<UserRoleItem[]>(initialUsers);
  const [searchUser, setSearchUser] = useState("");

  const togglePermission = (index: number, roleKey: keyof RolePermission) => {
    setPermissions((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updatedVal = !item[roleKey];
          toast.success(`Updated ${roleKey} permission for ${item.module}`);
          return { ...item, [roleKey]: updatedVal };
        }
        return item;
      })
    );
  };

  const handleRoleChange = (userId: string, newRole: UserRoleItem["role"]) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast.success(`User authority updated to ${newRole.replace("_", " ").toUpperCase()}!`);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.department.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Admin Control Center & Authority Scoping</h1>
        <p className="text-sm text-muted-foreground">
          Configure Role-Based Access Control (RBAC), fine-grained module permissions, and user role assignments.
        </p>
      </div>

      <Tabs defaultValue="permissions">
        <TabsList>
          <TabsTrigger value="permissions" className="gap-2"><ShieldCheck className="h-4 w-4" /> Role Permission Matrix</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><UserCheck className="h-4 w-4" /> User Authority Assignment</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" /> Company Setup</TabsTrigger>
        </TabsList>

        {/* TAB 1: PERMISSION MATRIX */}
        <TabsContent value="permissions" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Module Permission Toggles</CardTitle>
                <CardDescription>
                  Define exact access rights for Super Admin, HR Admin, Finance Manager, Team Lead, and Employee.
                </CardDescription>
              </div>
              <Badge variant="outline" className="gap-1 font-mono text-xs">
                <Lock className="h-3 w-3 text-rose-500" /> Fine-Grained RBAC Active
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-muted/40">
                    <TableHead className="w-64 font-bold">Module Capability</TableHead>
                    <TableHead className="text-center font-bold">Super Admin</TableHead>
                    <TableHead className="text-center font-bold">HR Admin</TableHead>
                    <TableHead className="text-center font-bold">Finance Mgr</TableHead>
                    <TableHead className="text-center font-bold">Team Lead</TableHead>
                    <TableHead className="text-center font-bold">Employee</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-sm text-foreground">{item.module}</TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.superAdmin} onCheckedChange={() => togglePermission(idx, "superAdmin")} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.hrAdmin} onCheckedChange={() => togglePermission(idx, "hrAdmin")} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.financeMgr} onCheckedChange={() => togglePermission(idx, "financeMgr")} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.teamLead} onCheckedChange={() => togglePermission(idx, "teamLead")} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch checked={item.employee} onCheckedChange={() => togglePermission(idx, "employee")} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: USER ROLE ASSIGNMENT */}
        <TabsContent value="users" className="pt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>User Role & Authority Assignment</CardTitle>
                <CardDescription>Assign specific administrative roles to company staff.</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff or email..."
                  className="pl-8"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Assigned Authority Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-bold text-sm">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-xs">{u.department}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(val: any) => handleRoleChange(u.id, val)}>
                          <SelectTrigger className="w-48 h-8 text-xs font-semibold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin (Full Access)</SelectItem>
                            <SelectItem value="hr_admin">HR Admin</SelectItem>
                            <SelectItem value="finance_mgr">Finance Manager</SelectItem>
                            <SelectItem value="manager">Team Manager / Lead</SelectItem>
                            <SelectItem value="employee">Employee (Self-Service)</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          Active Role
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: COMPANY SETUP */}
        <TabsContent value="company" className="pt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-base">Legal Entity Information</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><Label className="text-xs">Company Legal Name</Label><Input defaultValue="SAVANTEVO SOLUTIONS PRIVATE LIMITED" /></div>
                <div><Label className="text-xs">Trade Brand Name</Label><Input defaultValue="KollegeApply / CollegeSera" /></div>
                <div><Label className="text-xs">Corporate Office Address</Label><Input defaultValue="Bengaluru HQ, Karnataka, India" /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Working Hours & Shift Policy</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><Label className="text-xs">Standard Shift Duration</Label><Input defaultValue="09:30 AM – 06:30 PM (9 Hours)" /></div>
                <div><Label className="text-xs">Grace Period for Clock In</Label><Input defaultValue="15 Minutes" /></div>
                <div><Label className="text-xs">Weekly Off Days</Label><Input defaultValue="Saturday & Sunday" /></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
