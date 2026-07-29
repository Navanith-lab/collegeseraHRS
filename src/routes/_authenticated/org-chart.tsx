import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEmployees } from "@/lib/hrms.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/org-chart")({
  head: () => ({ meta: [{ title: "Org Chart — CollegeSera HRMS" }] }),
  component: OrgChartPage,
});

type Emp = {
  id: string;
  full_name: string;
  designation?: string | null;
  reporting_manager_id?: string | null;
  department?: { name: string } | null;
};

function OrgChartPage() {
  const fn = useServerFn(listEmployees);
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["employees"], queryFn: () => fn() });
  const employees = rows as unknown as Emp[];

  const byManager = new Map<string | null, Emp[]>();
  employees.forEach((e) => {
    const k = e.reporting_manager_id ?? null;
    if (!byManager.has(k)) byManager.set(k, []);
    byManager.get(k)!.push(e);
  });

  const renderNode = (e: Emp) => {
    const children = byManager.get(e.id) ?? [];
    return (
      <div key={e.id} className="flex flex-col items-center gap-3">
        <Card className="w-56">
          <CardContent className="flex items-center gap-3 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {e.full_name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{e.full_name}</div>
              <div className="truncate text-xs text-muted-foreground">{e.designation ?? "—"}</div>
              <div className="truncate text-[10px] text-muted-foreground">{e.department?.name ?? ""}</div>
            </div>
          </CardContent>
        </Card>
        {children.length > 0 && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex flex-wrap items-start justify-center gap-6">
              {children.map(renderNode)}
            </div>
          </>
        )}
      </div>
    );
  };

  const roots = byManager.get(null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Org Chart</h1>
        <p className="text-sm text-muted-foreground">Visual reporting hierarchy across the company.</p>
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : roots.length === 0 ? (
        <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No employees to display.</CardContent></Card>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex min-w-max flex-wrap items-start justify-center gap-8 p-4">
            {roots.map(renderNode)}
          </div>
        </div>
      )}
    </div>
  );
}
