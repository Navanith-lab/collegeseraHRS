import { Bell, LogOut, Search, User as UserIcon, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";

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

  const displayName = userName || "Navaneetha";
  const firstName = displayName.split(" ")[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card/95 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div>
          <h2 className="text-base font-bold leading-none tracking-tight text-rose-500 flex items-center gap-1.5">
            Hey {firstName},
          </h2>
          <p className="mt-1 text-xs text-muted-foreground font-medium">
            Have A Wonderful Day Ahead
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full border p-0 hover:bg-muted/60">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-900 text-white text-xs font-bold">
                  {firstName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-semibold">{displayName}</span>
              <span className="text-xs font-normal text-muted-foreground">{userEmail || "user@kollegeapply.com"}</span>
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
              <LogOut className="mr-2 h-4 w-4 text-rose-500" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
