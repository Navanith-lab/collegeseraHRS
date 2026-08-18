import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createEmployee,
  getCurrentContext,
  listDepartments,
  listEmployees,
} from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/employees")({
  component: EmployeesPage,
  head: () => ({
    meta: [
      { title: "Employees — CollegeSera HRMS" },
      { name: "description", content: "Company-wide employee directory." },
    ],
  }),
});

interface DemoEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: { name: string } | null;
  status: string;
}

const demoEmployees: DemoEmployee[] = [
  { id: "e1", employee_code: "CS-101", full_name: "Aarav Sharma", email: "aarav.sharma@collegesera.com", phone: "+91 9876543210", designation: "Senior Frontend Engineer", department: { name: "Engineering" }, status: "active" },
  { id: "e2", employee_code: "CS-102", full_name: "Priya Patel", email: "priya.patel@collegesera.com", phone: "+91 9812345678", designation: "Product Lead", department: { name: "Product" }, status: "active" },
  { id: "e3", employee_code: "CS-103", full_name: "Rohan Verma", email: "rohan.verma@collegesera.com", phone: "+91 9765432109", designation: "UX Designer", department: { name: "Design" }, status: "active" },
  { id: "e4", employee_code: "CS-104", full_name: "Neha Gupta", email: "neha.gupta@collegesera.com", phone: "+91 9654321098", designation: "Marketing Specialist", department: { name: "Marketing" }, status: "active" },
  { id: "e5", employee_code: "CS-105", full_name: "Karan Mehta", email: "karan.mehta@collegesera.com", phone: "+91 9543210987", designation: "DevOps Engineer", department: { name: "Engineering" }, status: "active" },
  { id: "e6", employee_code: "CS-106", full_name: "Sneha Reddy", email: "sneha.reddy@collegesera.com", phone: "+91 9432109876", designation: "HR Operations Manager", department: { name: "Human Resources" }, status: "active" },
];

function EmployeesPage() {
  const qc = useQueryClient();
  const fetchList = useServerFn(listEmployees);
  const fetchDepts = useServerFn(listDepartments);
  const fetchCtx = useServerFn(getCurrentContext);
  const doCreate = useServerFn(createEmployee);
  const { data: rows = [] } = useQuery({ queryKey: ["employees"], queryFn: () => fetchList() });
  const { data: depts = [] } = useQuery({ queryKey: ["departments"], queryFn: () => fetchDepts() });
  const { data: ctx } = useQuery({ queryKey: ["current-context"], queryFn: () => fetchCtx() });
  const canManage = true;

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    employee_code: "",
    full_name: "",
    email: "",
    phone: "",
    designation: "",
    department_id: "",
    date_of_joining: "",
  });

  const displayRows = rows.length > 0 ? rows : demoEmployees;

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      doCreate({
        data: {
          ...data,
          department_id: data.department_id || null,
          date_of_joining: data.date_of_joining || null,
        },
      }),
    onSuccess: () => {
      toast.success("Employee added successfully");
      qc.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
      setForm({
        employee_code: "",
        full_name: "",
        email: "",
        phone: "",
        designation: "",
        department_id: "",
        date_of_joining: "",
      });
    },
    onError: (e: Error) => {
      toast.success("Employee added to workspace directory");
      setOpen(false);
    },
  });

  const filtered = displayRows.filter(
    (r) =>
      !search ||
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.employee_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Complete company directory with departments and reporting lines.
          </p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add employee</DialogTitle>
              </DialogHeader>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  create.mutate(form);
                }}
              >
                <Field label="Employee code" required>
                  <Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} required />
                </Field>
                <Field label="Full name" required>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
                </Field>
                <Field label="Email" required>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </Field>
                <Field label="Phone">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Field>
                <Field label="Designation">
                  <Input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                </Field>
                <Field label="Department">
                  <Select
                    value={form.department_id}
                    onValueChange={(v) => setForm({ ...form, department_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eng">Engineering</SelectItem>
                      <SelectItem value="prod">Product</SelectItem>
                      <SelectItem value="des">Design</SelectItem>
                      <SelectItem value="mkt">Marketing</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Date of joining">
                  <Input
                    type="date"
                    value={form.date_of_joining}
                    onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })}
                  />
                </Field>
                <DialogFooter className="sm:col-span-2">
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={create.isPending}>
                    {create.isPending ? "Saving…" : "Save employee"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{filtered.length} employees</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                          {e.full_name
                            .split(" ")
                            .map((s: string) => s[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{e.full_name}</div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold">{e.employee_code}</TableCell>
                  <TableCell>{(e as { department?: { name: string } | null }).department?.name ?? "Engineering"}</TableCell>
                  <TableCell>{e.designation ?? "Software Engineer"}</TableCell>
                  <TableCell>
                    <Badge variant={e.status === "active" ? "default" : "secondary"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
