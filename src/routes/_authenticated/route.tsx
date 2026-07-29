import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { HRMSChatbot } from "@/components/hrms-chatbot";
import { useServerFn } from "@tanstack/react-start";
import { getCurrentContext } from "@/lib/hrms.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const fetchCtx = useServerFn(getCurrentContext);
  const { data } = useQuery({
    queryKey: ["current-context"],
    queryFn: () => fetchCtx(),
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex min-w-0 flex-1 flex-col">
          <TopBar userName={data?.profile?.full_name} userEmail={data?.profile?.email ?? undefined} />
          <main className="flex-1 px-4 py-6 md:px-8">
            <Outlet />
          </main>
        </SidebarInset>
        <HRMSChatbot />
      </div>
    </SidebarProvider>
  );
}
