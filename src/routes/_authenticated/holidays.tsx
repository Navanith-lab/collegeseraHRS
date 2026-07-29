import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listHolidays } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/holidays")({
  component: HolidaysPage,
  head: () => ({ meta: [{ title: "Holidays — CollegeSera HRMS" }] }),
});

function HolidaysPage() {
  const fetchList = useServerFn(listHolidays);
  const { data = [] } = useQuery({ queryKey: ["holidays"], queryFn: () => fetchList() });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Holiday calendar</h1>
        <p className="text-sm text-muted-foreground">All company-wide holidays for the year.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-accent/10 text-accent">
                <span className="text-[10px] uppercase">{format(new Date(h.date), "MMM")}</span>
                <span className="text-xl font-bold leading-none">{format(new Date(h.date), "d")}</span>
              </div>
              <div>
                <CardTitle className="text-base">{h.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{format(new Date(h.date), "EEEE, yyyy")}</p>
              </div>
            </CardHeader>
            {h.description && (
              <CardContent className="pt-0 text-sm text-muted-foreground">{h.description}</CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
