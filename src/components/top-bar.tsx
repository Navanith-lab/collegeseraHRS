import { Bell, LogOut, Search, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getNotifications, markAllNotificationsRead } from "@/lib/hrms.functions";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function TopBar({
  userName,
  userEmail,
  userRole,
}: {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchNotifs = useServerFn(getNotifications);
  const markRead = useServerFn(markAllNotificationsRead);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs(),
    refetchInterval: 60_000,
  });
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAll = useMutation({
    mutationFn: () => markRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const initials = (userName || userEmail || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search employees, leaves, tickets…" className="pl-9 bg-muted/40" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-sm font-semibold">Notifications</div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                disabled={unreadCount === 0 || markAll.isPending}
                onClick={() => markAll.mutate()}
              >
                Mark all read
              </Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "px-3 py-2.5 text-sm",
                        !n.is_read && "border-l-2 border-primary bg-muted/30",
                      )}
                    >
                      <div className="font-medium">{n.title}</div>
                      {n.body && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{n.body}</div>
                      )}
                      <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex h-9 items-center gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-xs font-medium">{userName || "User"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {userRole ? userRole.replace("_", " ") : userEmail}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span>{userName || "User"}</span>
              <span className="text-[10px] font-normal text-muted-foreground">{userEmail}</span>
              {userRole && (
                <span className="mt-0.5 text-[10px] font-normal uppercase tracking-wide text-primary">
                  {userRole.replace("_", " ")}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <UserIcon className="mr-2 h-4 w-4" /> My Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/auth", replace: true });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
