import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listApplications, updateApplicationStatus, listJobOpenings, createApplication, getCurrentContext } from "@/lib/hrms.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, LayoutGrid, List, Star, FileCheck, Mail, UserCheck, ChevronRight, Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recruitment/applications")({
  head: () => ({ meta: [{ title: "ATS Recruitment Kanban — CollegeSera HRMS" }] }),
  component: ApplicationsPage,
});

interface Candidate {
  id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  job_title: string;
  status: "applied" | "shortlisted" | "interview_scheduled" | "offer_sent" | "hired" | "rejected";
  rating: number;
  expectedLpa: string;
}

const initialCandidates: Candidate[] = [
  { id: "c1", applicant_name: "Rahul Verma", applicant_email: "rahul.verma@example.com", applicant_phone: "+91 9876543210", job_title: "Senior Fullstack Engineer", status: "applied", rating: 4, expectedLpa: "₹24 LPA" },
  { id: "c2", applicant_name: "Ananya Deshmukh", applicant_email: "ananya.d@example.com", applicant_phone: "+91 9812345678", job_title: "Product Designer (UI/UX)", status: "shortlisted", rating: 5, expectedLpa: "₹18 LPA" },
  { id: "c3", applicant_name: "Karan Mehta", applicant_email: "karan.mehta@example.com", applicant_phone: "+91 9765432109", job_title: "Senior Fullstack Engineer", status: "interview_scheduled", rating: 4, expectedLpa: "₹26 LPA" },
  { id: "c4", applicant_name: "Sneha Reddy", applicant_email: "sneha.reddy@example.com", applicant_phone: "+91 9654321098", job_title: "HR Operations Lead", status: "offer_sent", rating: 5, expectedLpa: "₹16 LPA" },
  { id: "c5", applicant_name: "Vikram Malhotra", applicant_email: "vikram.m@example.com", applicant_phone: "+91 9543210987", job_title: "DevOps Lead", status: "hired", rating: 5, expectedLpa: "₹30 LPA" },
];

const STAGES = [
  { id: "applied", label: "Applied", color: "border-blue-300 bg-blue-50/50" },
  { id: "shortlisted", label: "Shortlisted", color: "border-purple-300 bg-purple-50/50" },
  { id: "interview_scheduled", label: "Interview", color: "border-amber-300 bg-amber-50/50" },
  { id: "offer_sent", label: "Offer Sent", color: "border-emerald-300 bg-emerald-50/50" },
  { id: "hired", label: "Hired", color: "border-emerald-500 bg-emerald-100/60" },
];

function ApplicationsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);

  const moveCandidate = (id: string, nextStatus: Candidate["status"]) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: nextStatus } : c))
    );
    toast.success(`Candidate status moved to ${nextStatus.replace("_", " ")}`);
  };

  const generateOfferLetter = (c: Candidate) => {
    setSelectedCandidate(c);
    setOfferDialogOpen(true);
  };

  const printOfferLetter = () => {
    if (!selectedCandidate) return;
    const html = `<!doctype html><html><head><title>Offer Letter - ${selectedCandidate.applicant_name}</title>
    <style>body{font-family:sans-serif;padding:40px;line-height:1.6}.hdr{border-bottom:2px solid #0f2544;padding-bottom:12px}</style></head>
    <body>
      <div class="hdr"><h2>CollegeSera HR Suite — Official Offer of Employment</h2></div>
      <p>Dear <strong>${selectedCandidate.applicant_name}</strong>,</p>
      <p>We are delighted to extend an offer for the position of <strong>${selectedCandidate.job_title}</strong> at CollegeSera.</p>
      <p><strong>Offered Remuneration:</strong> ${selectedCandidate.expectedLpa}</p>
      <p>Please review and sign this offer letter within 5 business days.</p>
      <br/><p>Warm regards,<br/>People Operations Team<br/>CollegeSera</p>
    </body></html>`;
    const w = window.open("", "_blank");
    w?.document.write(html);
    w?.document.close();
    toast.success("Offer letter generated for printing!");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">ATS Kanban Candidate Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Drag candidate cards through hiring stages, score interviews, and generate digital offer letters.
          </p>
        </div>
      </div>

      <Tabs defaultValue="kanban">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2"><LayoutGrid className="h-4 w-4" /> Visual Kanban Board</TabsTrigger>
            <TabsTrigger value="table" className="gap-2"><List className="h-4 w-4" /> Table View</TabsTrigger>
          </TabsList>
        </div>

        {/* KANBAN BOARD VIEW */}
        <TabsContent value="kanban" className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {STAGES.map((stage) => {
              const stageCandidates = candidates.filter((c) => c.status === stage.id);
              return (
                <div key={stage.id} className={`rounded-xl border ${stage.color} p-3 min-h-[500px]`}>
                  <div className="flex items-center justify-between pb-3 border-b mb-3">
                    <span className="font-bold text-sm text-foreground">{stage.label}</span>
                    <Badge variant="secondary" className="font-mono text-xs">{stageCandidates.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {stageCandidates.map((c) => (
                      <Card key={c.id} className="shadow-sm hover:shadow-md transition-all border-muted">
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{c.applicant_name}</h4>
                              <p className="text-xs text-muted-foreground">{c.job_title}</p>
                            </div>
                            <div className="flex items-center text-amber-500 text-xs font-bold">
                              <Star className="h-3 w-3 fill-amber-400 mr-0.5" /> {c.rating}
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground pt-1 flex items-center justify-between border-t border-muted/50">
                            <span>{c.expectedLpa}</span>
                            <span className="font-mono">{c.applicant_phone}</span>
                          </div>

                          <div className="pt-2 flex flex-wrap gap-1.5 justify-end">
                            {stage.id === "interview_scheduled" && (
                              <Button size="xs" className="h-7 text-xs gap-1" onClick={() => moveCandidate(c.id, "offer_sent")}>
                                Pass & Offer <ChevronRight className="h-3 w-3" />
                              </Button>
                            )}
                            {stage.id === "offer_sent" && (
                              <Button size="xs" variant="outline" className="h-7 text-xs gap-1" onClick={() => generateOfferLetter(c)}>
                                <Mail className="h-3 w-3" /> Offer Letter
                              </Button>
                            )}
                            {stage.id === "offer_sent" && (
                              <Button size="xs" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => moveCandidate(c.id, "hired")}>
                                Mark Hired
                              </Button>
                            )}
                            {stage.id === "applied" && (
                              <Button size="xs" variant="secondary" className="h-7 text-xs" onClick={() => moveCandidate(c.id, "shortlisted")}>
                                Shortlist
                              </Button>
                            )}
                            {stage.id === "shortlisted" && (
                              <Button size="xs" variant="secondary" className="h-7 text-xs" onClick={() => moveCandidate(c.id, "interview_scheduled")}>
                                Schedule Interview
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* TABLE VIEW */}
        <TabsContent value="table" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Target Job</TableHead>
                    <TableHead>Expected Compensation</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-semibold text-sm">{c.applicant_name}</div>
                        <div className="text-xs text-muted-foreground">{c.applicant_email}</div>
                      </TableCell>
                      <TableCell>{c.job_title}</TableCell>
                      <TableCell className="font-mono text-sm">{c.expectedLpa}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 mr-1" /> {c.rating} / 5
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{c.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => generateOfferLetter(c)}>
                          Offer Letter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Offer Letter Generator Dialog */}
      {selectedCandidate && (
        <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" /> Digital Offer Letter Preview
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 rounded-lg border bg-muted/20 p-4 text-sm font-sans">
              <div className="border-b pb-2">
                <h3 className="font-bold text-base text-primary">CollegeSera HR Suite</h3>
                <p className="text-xs text-muted-foreground">Official Letter of Employment Offer</p>
              </div>

              <p>Candidate: <strong className="text-foreground">{selectedCandidate.applicant_name}</strong></p>
              <p>Role: <strong>{selectedCandidate.job_title}</strong></p>
              <p>Offered CTC: <strong>{selectedCandidate.expectedLpa}</strong></p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We are excited to invite you to join our growing team. This offer is contingent upon successful verification of academic credentials and background check.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>Close</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1" onClick={printOfferLetter}>
                  <Mail className="h-4 w-4" /> Print / Send Offer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
