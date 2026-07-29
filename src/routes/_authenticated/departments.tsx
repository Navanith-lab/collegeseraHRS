import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  createDepartment,
  deleteDepartment,
  getCurrentContext,
  listDepartments,
  listEmployees,
  updateDepartment,
} from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({ meta: [{ title: "Departments — CollegeSera HRMS" }] }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listDepartments);
  const emps = useServerFn(listEmployees);
  const ctx = useServerFn(getCurrentContext);
  const create = useServerFn(createDepartment);
  const update = useServerFn(updateDepartment);
  const del = useServerFn(deleteDepartment);

  const { data: depts = [], isLoading } = useQuery({ queryKey: ["departments"], queryFn: () => list() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => emps() });
  const { data: c } = useQuery({ queryKey: ["current-context"], queryFn: () => ctx() });
  const canManage = !!c?.roles?.some((r) => r === "hr_admin" || r === "super_admin");

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<{ id?: string; name: string; description: string }>({ name: "", description: "" });

  const save = useMutation({
    mutationFn: async () =>
      edit.id
        ? update({ data: { id: edit.id, name: edit.name, description: edit.description } })
        : create({ data: { name: edit.name, description: edit.description } }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["departments"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Departments</h1>
          <p className="text-sm text-muted-foreground">Organize employees into functional teams.</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEdit({ name: "", description: "" })}>
                <Plus className="mr-2 h-4 w-4" /> Add department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{edit.id ? "Edit" : "New"} department</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={!edit.name || save.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : depts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">No departments yet.</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {depts.map((d) => {
            const count = employees.filter((e) => (e as { department_id?: string }).department_id === d.id).length;
            return (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{d.name}</CardTitle>
                    <div className="mt-1 text-xs text-muted-foreground">{count} employee{count === 1 ? "" : "s"}</div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEdit({ id: d.id, name: d.name, description: d.description ?? "" });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm(`Delete ${d.name}?`)) remove.mutate(d.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {d.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{d.description}</p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
