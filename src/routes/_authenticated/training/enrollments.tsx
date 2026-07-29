import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyEnrollments } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/enrollments")({
  head: () => ({ meta: [{ title: "My Enrollments — CollegeSera HRMS" }] }),
  component: EnrollmentsPage,
});

function EnrollmentsPage() {
  const { data: rows = [] } = useQuery({ queryKey: ["my-enrollments"], queryFn: () => useServerFn(listMyEnrollments)() });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My Enrollments</h1>
        <p className="text-sm text-muted-foreground">Courses you're enrolled in.</p>
      </div>
      {rows.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-2 py-14"><GraduationCap className="h-10 w-10 text-muted-foreground" /><div className="text-sm text-muted-foreground">No enrollments yet</div></CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => {
            const row = r as { id: string; status: string; score?: number; course?: { title: string; trainer?: string; mode: string } };
            return (
              <Card key={row.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle className="text-base">{row.course?.title ?? "—"}</CardTitle>
                  <Badge variant={row.status === "completed" ? "default" : "secondary"}>{row.status}</Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {row.course?.trainer && <div>Trainer: {row.course.trainer}</div>}
                  {row.score != null && <div>Score: {row.score}</div>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
