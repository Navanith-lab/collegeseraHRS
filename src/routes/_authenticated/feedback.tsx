import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [subject, setSubject] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !feedback) return toast.error("Please enter subject and message");
    toast.success("Thank you! Your feedback has been submitted to HR.");
    setSubject("");
    setFeedback("");
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Employee Feedback & Suggestions</h1>
        <p className="text-sm text-muted-foreground">
          Share your feedback, work culture ideas, or workplace suggestions directly with the HR team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-rose-500" /> Submit Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Subject / Topic</Label>
              <Input
                required
                placeholder="e.g. Workstation ergonomics, Pantry suggestion..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <Label>Detailed Feedback</Label>
              <Textarea
                required
                rows={5}
                placeholder="Write your feedback or constructive suggestions here..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full gap-2 bg-slate-900 text-white">
              <Send className="h-4 w-4" /> Submit Feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
