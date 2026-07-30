import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Award, Grid, Users, TrendingUp, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/performance/appraisals")({
  head: () => ({ meta: [{ title: "360 Appraisals & 9-Box Grid — CollegeSera HRMS" }] }),
  component: AppraisalsPage,
});

interface EmployeeTalent {
  id: string;
  name: string;
  role: string;
  department: string;
  selfRating: number;
  peerRating: number;
  mgrRating: number;
  performance: "High" | "Medium" | "Low";
  potential: "High" | "Medium" | "Low";
  gridCategory: string;
}

const talentData: EmployeeTalent[] = [
  { id: "1", name: "Aarav Sharma", role: "Senior Frontend Engineer", department: "Engineering", selfRating: 4.5, peerRating: 4.6, mgrRating: 4.8, performance: "High", potential: "High", gridCategory: "Star (High Perf / High Pot)" },
  { id: "2", name: "Priya Patel", role: "Product Lead", department: "Product", selfRating: 4.2, peerRating: 4.4, mgrRating: 4.5, performance: "High", potential: "High", gridCategory: "Star (High Perf / High Pot)" },
  { id: "3", name: "Rohan Verma", role: "UX Designer", department: "Design", selfRating: 4.0, peerRating: 3.8, mgrRating: 4.1, performance: "High", potential: "Medium", gridCategory: "High Performer" },
  { id: "4", name: "Neha Gupta", role: "Marketing Specialist", department: "Marketing", selfRating: 3.8, peerRating: 4.0, mgrRating: 4.2, performance: "Medium", potential: "High", gridCategory: "High Potential" },
  { id: "5", name: "Karan Mehta", role: "DevOps Engineer", department: "Engineering", selfRating: 3.5, peerRating: 3.6, mgrRating: 3.7, performance: "Medium", potential: "Medium", gridCategory: "Core Player" },
];

function AppraisalsPage() {
  const [employees] = useState<EmployeeTalent[]>(talentData);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">360-Degree Appraisal & 9-Box Grid</h1>
          <p className="text-sm text-muted-foreground">
            Evaluate employee performance, peer feedback, self-ratings, and 9-box talent matrix mapping.
          </p>
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid" className="gap-2"><Grid className="h-4 w-4" /> 9-Box Talent Matrix</TabsTrigger>
          <TabsTrigger value="360" className="gap-2"><Users className="h-4 w-4" /> 360 Feedback Scores</TabsTrigger>
        </TabsList>

        {/* 9-BOX TALENT MATRIX GRID */}
        <TabsContent value="grid" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>9-Box Performance vs Potential Matrix</CardTitle>
              <CardDescription>
                Strategic talent classification for succession planning and leadership development.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center text-xs font-semibold">
                {/* Row 1: High Potential */}
                <div className="rounded-lg border bg-amber-500/10 p-4 border-amber-200">
                  <div className="text-amber-700 font-bold uppercase tracking-wider">Enigma</div>
                  <div className="text-[10px] text-muted-foreground mt-1">High Pot / Low Perf</div>
                </div>
                <div className="rounded-lg border bg-blue-500/10 p-4 border-blue-200">
                  <div className="text-blue-700 font-bold uppercase tracking-wider">Growth Employee</div>
                  <div className="text-[10px] text-muted-foreground mt-1">High Pot / Med Perf</div>
                  <div className="mt-2 text-xs font-bold text-foreground">Neha Gupta</div>
                </div>
                <div className="rounded-lg border bg-emerald-500/20 p-4 border-emerald-300 shadow-sm">
                  <div className="text-emerald-700 font-extrabold uppercase tracking-wider flex items-center justify-center gap-1">
                    <Award className="h-3.5 w-3.5" /> Star Talent
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">High Pot / High Perf</div>
                  <div className="mt-2 text-xs font-bold text-foreground space-y-0.5">
                    <div>Aarav Sharma</div>
                    <div>Priya Patel</div>
                  </div>
                </div>

                {/* Row 2: Medium Potential */}
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="text-gray-700 font-bold uppercase tracking-wider">Dilemma</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Med Pot / Low Perf</div>
                </div>
                <div className="rounded-lg border bg-primary/10 p-4 border-primary/20">
                  <div className="text-primary font-bold uppercase tracking-wider">Core Player</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Med Pot / Med Perf</div>
                  <div className="mt-2 text-xs font-bold text-foreground">Karan Mehta</div>
                </div>
                <div className="rounded-lg border bg-blue-500/10 p-4 border-blue-200">
                  <div className="text-blue-700 font-bold uppercase tracking-wider">High Performer</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Med Pot / High Perf</div>
                  <div className="mt-2 text-xs font-bold text-foreground">Rohan Verma</div>
                </div>

                {/* Row 3: Low Potential */}
                <div className="rounded-lg border bg-rose-500/10 p-4 border-rose-200">
                  <div className="text-rose-700 font-bold uppercase tracking-wider">Risk / Action Required</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Low Pot / Low Perf</div>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="text-gray-700 font-bold uppercase tracking-wider">Effective Contributor</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Low Pot / Med Perf</div>
                </div>
                <div className="rounded-lg border bg-gray-50 p-4">
                  <div className="text-gray-700 font-bold uppercase tracking-wider">Trusted Professional</div>
                  <div className="text-[10px] text-muted-foreground mt-1">Low Pot / High Perf</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 360 FEEDBACK SCORES */}
        <TabsContent value="360" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>360-Degree Evaluation Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Self Review</TableHead>
                    <TableHead>Peer Review</TableHead>
                    <TableHead>Manager Rating</TableHead>
                    <TableHead>Matrix Classification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{e.name}</div>
                        <div className="text-xs text-muted-foreground">{e.role} • {e.department}</div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{e.selfRating} / 5</TableCell>
                      <TableCell className="font-mono text-sm">{e.peerRating} / 5</TableCell>
                      <TableCell className="font-bold text-emerald-600">{e.mgrRating} / 5</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            e.gridCategory.includes("Star")
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                              : "bg-blue-500/10 text-blue-600 border-blue-200"
                          }
                        >
                          {e.gridCategory}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
