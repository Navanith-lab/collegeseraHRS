import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  User,
  Clock,
  Calendar,
  CalendarDays,
  Receipt,
  FileEdit,
  Laptop,
  MessageSquare,
  Ticket,
  Users,
  ShieldCheck,
  LogOut,
  ChevronDown
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BrandLogo } from "./brand-logo";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "User Dashboard", url: "/profile", icon: User },
  { title: "Attendance", url: "/attendance", icon: Clock },
  { title: "All Holidays", url: "/holidays", icon: Calendar },
  { title: "Leave", url: "/leaves", icon: CalendarDays },
  { title: "Expenses", url: "/expenses", icon: Receipt, hasDropdown: true },
  { title: "Regularization", url: "/regularization", icon: FileEdit },
  { title: "Assigned Assets", url: "/assets", icon: Laptop },
  { title: "Feedback", url: "/feedback", icon: MessageSquare },
  { title: "Tickets", url: "/helpdesk", icon: Ticket },
  { title: "Meetings", url: "/meetings", icon: Users },
  { title: "Company Policies", url: "/documents", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const isActive = (url: string) => pathname === url || (url !== "/dashboard" && pathname.startsWith(url));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <Sidebar collapsible="icon" className="border-r bg-slate-50/50 dark:bg-card">
      <SidebarHeader className="border-b border-sidebar-border py-4 px-4">
        <BrandLogo />
      </SidebarHeader>
      <SidebarContent className="py-2 px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "bg-slate-200/70 dark:bg-slate-800 text-rose-500 font-semibold shadow-xs hover:bg-slate-200/90"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                      }
                    >
                      <Link to={item.url} className="flex items-center justify-between py-2.5 px-3">
                        <div className="flex items-center gap-3">
                          <item.icon className={`h-4 w-4 ${active ? "text-rose-500" : "text-slate-500"}`} />
                          <span className="text-sm">{item.title}</span>
                        </div>
                        {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 space-y-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
        <div className="px-1 text-[10px] text-slate-400 text-center leading-tight">
          © SAVANTEVO SOLUTIONS PRIVATE LIMITED
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
