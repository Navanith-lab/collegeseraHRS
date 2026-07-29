import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAnnouncements } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/announcements")({
  component: AnnouncementsPage,
  head: () => ({ meta: [{ title: "Announcements — CollegeSera HRMS" }] }),
});

function AnnouncementsPage() {
  const fetchList = useServerFn(listAnnouncements);
  const { data = [] } = useQuery({ queryKey: ["announcements"], queryFn: () => fetchList() });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Announcements</h1>
        <p className="text-sm text-muted-foreground">Company news, circulars and events.</p>
      </div>
      {data.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No announcements yet.
          </CardContent>
        </Card>
      )}
      <div className="space-y-3">
        {data.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle>{a.title}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Published {format(new Date(a.published_at), "MMM d, yyyy")}
              </p>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{a.body}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
