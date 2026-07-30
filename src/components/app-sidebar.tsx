import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Clock, CalendarDays, Megaphone, CalendarCheck, Settings,
  Building2, Network, CalendarClock, Banknote, FileText, Briefcase, ClipboardList,
  Target, Star, BookOpen, Receipt, Package, FolderOpen, DoorOpen, BarChart2,
  UserCircle, Plane, Ticket, ReceiptText, UserPlus, LifeBuoy, ShieldCheck, Play, Kanban, Grid
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandLogo } from "./brand-logo";

type NavItem = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type NavSection = { label: string; items: NavItem[] };

const sections: NavSection[] = [
  { label: "Core HR", items: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Profile", url: "/profile", icon: UserCircle },
  ]},
  { label: "Workforce", items: [
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Onboarding Tracker", url: "/onboarding", icon: UserPlus },
    { title: "Org Chart", url: "/org-chart", icon: Network },
    { title: "Departments", url: "/departments", icon: Building2 },
    { title: "Shifts & Roster", url: "/shifts", icon: CalendarClock },
  ]},
  { label: "Time & Attendance", items: [
    { title: "Attendance & Geo", url: "/attendance", icon: Clock },
    { title: "Leave Management", url: "/leaves", icon: CalendarDays },
  ]},
  { label: "Payroll & Tax", items: [
    { title: "Payroll Execution Wizard", url: "/payroll/runs", icon: Play },
    { title: "Salary Structures", url: "/payroll/salary-structures", icon: Banknote },
    { title: "Payslips & Form 16", url: "/payroll/payslips", icon: FileText },
  ]},
  { label: "Talent & ATS", items: [
    { title: "ATS Kanban Pipeline", url: "/recruitment/applications", icon: Kanban },
    { title: "Job Openings", url: "/recruitment/jobs", icon: Briefcase },
    { title: "Weighted OKRs", url: "/performance/goals", icon: Target },
    { title: "360 Appraisals & 9-Box", url: "/performance/appraisals", icon: Grid },
    { title: "Training & Dev", url: "/training/courses", icon: BookOpen },
  ]},
  { label: "Employee Support", items: [
    { title: "HR Helpdesk Tickets", url: "/helpdesk", icon: LifeBuoy },
    { title: "Expenses", url: "/expenses", icon: Receipt },
    { title: "Assets", url: "/assets", icon: Package },
  ]},
  { label: "Travel", items: [
    { title: "Travel Requests", url: "/travel", icon: Plane },
    { title: "Tickets", url: "/travel/tickets", icon: Ticket },
    { title: "Travel Expenses", url: "/travel/expenses", icon: ReceiptText },
  ]},
  { label: "People Ops", items: [
    { title: "Exit & No-Dues Clearance", url: "/exit", icon: DoorOpen },
    { title: "Documents", url: "/documents", icon: FolderOpen },
  ]},
  { label: "Analytics & Security", items: [
    { title: "HR Analytics", url: "/reports", icon: BarChart2 },
    { title: "Security Audit Trail", url: "/audit-logs", icon: ShieldCheck },
  ]},
  { label: "Admin", items: [
    { title: "Holidays", url: "/holidays", icon: CalendarCheck },
    { title: "Announcements", url: "/announcements", icon: Megaphone },
    { title: "Settings", url: "/settings", icon: Settings },
  ]},
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border py-4">
        <BrandLogo variant="light" />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
