import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings")({
  component: MeetingsPage,
});

interface Meeting {
  id: string;
  title: string;
  time: string;
  date: string;
  organizer: string;
  attendees: number;
  link: string;
  type: "All Hands" | "Team Standup" | "1-on-1 Sync" | "Training";
}

function MeetingsPage() {
  const [meetings] = useState<Meeting[]>([
    {
      id: "1",
      title: "Weekly Engineering All-Hands",
      time: "10:30 AM – 11:30 AM",
      date: "Today, 5 Aug 2026",
      organizer: "Engineering Lead",
      attendees: 18,
      link: "https://meet.google.com/abc-defg-hij",
      type: "All Hands",
    },
    {
      id: "2",
      title: "Product Roadmap Sync Q3",
      time: "02:00 PM – 03:00 PM",
      date: "Tomorrow, 6 Aug 2026",
      organizer: "Product Lead",
      attendees: 8,
      link: "https://meet.google.com/xyz-uvwx-rst",
      type: "Team Standup",
    },
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scheduled Meetings & Syncs</h1>
        <p className="text-sm text-muted-foreground">
          View your upcoming team meetings, 1-on-1s, and department All-Hands sessions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {meetings.map((m) => (
          <Card key={m.id} className="hover:border-slate-400 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{m.type}</Badge>
                <span className="text-xs font-semibold text-rose-500">{m.date}</span>
              </div>
              <CardTitle className="mt-2 text-lg">{m.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" /> <span>{m.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> <span>Organizer: {m.organizer} ({m.attendees} attendees)</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  window.open(m.link, "_blank");
                  toast.success("Joining meeting...");
                }}
              >
                <Video className="h-4 w-4" /> Join Video Call <ExternalLink className="h-3 w-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
