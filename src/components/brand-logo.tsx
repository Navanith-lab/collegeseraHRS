import { GraduationCap } from "lucide-react";

export function BrandLogo({ variant = "default" }: { variant?: "default" | "light" }) {
  const isLight = variant === "light";
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground shadow-sm">
        <GraduationCap className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div
          className={`text-sm font-bold tracking-tight ${isLight ? "text-sidebar-foreground" : "text-foreground"}`}
        >
          College<span className="text-accent">Sera</span>
        </div>
        <div
          className={`text-[10px] uppercase tracking-widest ${isLight ? "text-sidebar-foreground/60" : "text-muted-foreground"}`}
        >
          HRMS
        </div>
      </div>
    </div>
  );
}
