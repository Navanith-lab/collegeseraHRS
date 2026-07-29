import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getChatbotContext, chatWithHRAssistant } from "@/lib/hrms.functions";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Msg = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(ctx: NonNullable<Awaited<ReturnType<typeof buildFake>>>): string {
  if (!ctx.hasEmployee) return "You are an HR Assistant for CollegeSera. The user has no employee record yet. Ask HR to complete onboarding.";
  const e = ctx.employee!;
  const b = ctx.balance;
  const bal = b
    ? `LEAVE BALANCE (${new Date().getFullYear()}):
  Casual: ${Number(b.casual_total) - Number(b.casual_used)} / ${b.casual_total} remaining
  Sick: ${Number(b.sick_total) - Number(b.sick_used)} / ${b.sick_total} remaining
  Privilege: ${Number(b.privilege_total) - Number(b.privilege_used)} / ${b.privilege_total} remaining
  WFH: ${Number(b.wfh_total) - Number(b.wfh_used)} / ${b.wfh_total} remaining
  Comp Off: ${Number(b.comp_off_total) - Number(b.comp_off_used)} / ${b.comp_off_total} remaining`
    : "LEAVE BALANCE: not yet configured";
  const slips = ctx.payslips.length
    ? "LAST 3 PAYSLIPS: " + ctx.payslips.map((s) => `${String(s.month).padStart(2,"0")}/${s.year} Net ₹${Number(s.net).toLocaleString()}`).join(" | ")
    : "LAST 3 PAYSLIPS: none";
  const att = ctx.todayAttendance ? `TODAY: In ${ctx.todayAttendance.check_in ?? "—"} · Out ${ctx.todayAttendance.check_out ?? "Not checked out"}` : "TODAY: not marked";
  const hol = ctx.holidays.length ? "NEXT HOLIDAYS: " + ctx.holidays.map((h) => `${h.name} on ${h.date}`).join(" | ") : "NEXT HOLIDAYS: none";
  const ann = ctx.announcements.length ? "RECENT ANNOUNCEMENTS: " + ctx.announcements.map((a) => a.title).join(" | ") : "";
  const upcoming = ctx.upcomingLeaves.length ? "UPCOMING APPROVED LEAVE: " + ctx.upcomingLeaves.map((l) => `${l.leave_type} ${l.start_date}→${l.end_date}`).join(" | ") : "";
  return `You are an HR Assistant for CollegeSera. Answer briefly, warmly, professionally. Use only facts below. If unsure, tell the user to raise a ticket with HR.

EMPLOYEE: ${e.name} | Code: ${e.code} | Dept: ${e.dept} | Designation: ${e.designation ?? "—"} | Joined: ${e.joined ?? "—"}
REPORTING TO: ${e.manager}

${bal}

${att}

${slips}

${hol}

${ann}

${upcoming}

PENDING APPROVALS: ${ctx.pendingCount} leave requests pending

If asked about downloading payslip, tell them: "Open Payroll → Payslips and click Download next to the month."
If asked about applying leave, tell them: "Open Leave Management and click Apply Leave."
If asked about travel, say: "Open Travel Management to submit a new request."
Keep answers under 4 short sentences unless asked for detail.`;
}

// helper to type the ctx
async function buildFake() { return null as null | Awaited<ReturnType<typeof getChatbotContext>>; }

export function HRMSChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: ctx } = useQuery({ queryKey: ["chatbot-context"], queryFn: () => useServerFn(getChatbotContext)() });
  const chatFn = useServerFn(chatWithHRAssistant);

  useEffect(() => {
    if (ctx && messages.length === 0) {
      const name = ctx.hasEmployee ? ctx.employee!.name.split(" ")[0] : "there";
      setMessages([{ role: "assistant", content: `Hi ${name}! I'm your HR Assistant. Ask me about your leaves, payslips, attendance, travel, or anything HR-related.` }]);
    }
  }, [ctx, messages.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading || !ctx) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(ctx);
      const apiMessages = next.filter((m) => m.role === "user" || m.role === "assistant");
      const res = await chatFn({ data: { messages: apiMessages, systemPrompt } });
      setMessages([...next, { role: "assistant", content: res.reply || "(no response)" }]);
    } catch (e) {
      setMessages([...next, { role: "assistant", content: `Sorry — ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700"
          aria-label="Open HR Assistant"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-[9px] font-semibold">HR</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="flex items-start gap-3 bg-[#0f2544] p-3 text-white">
            <Bot className="mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <div className="text-sm font-semibold">HR Assistant</div>
              <div className="text-[10px] opacity-80">Ask me about leaves, payslips, travel…</div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-white/10" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-white text-gray-800 border"}`}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start"><div className="flex gap-1 rounded-xl border bg-white px-3 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]"/>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]"/>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500"/>
              </div></div>
            )}
            <div ref={endRef} />
          </div>
          <div className="flex items-center gap-2 border-t bg-white p-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} placeholder="Type your question…" className="h-9" />
            <Button size="icon" onClick={send} disabled={loading || !input.trim()} className="h-9 w-9 shrink-0 bg-indigo-600 hover:bg-indigo-700"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
}
