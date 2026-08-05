import { Sparkles } from "lucide-react";

export function BrandLogo({ variant = "default" }: { variant?: "default" | "light" }) {
  const isLight = variant === "light";
  return (
    <div className="flex items-center gap-2 px-1">
      {/* KollegeApply Double-Diamond Icon */}
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-coral-500 to-rose-600 text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="h-5 w-5 text-white"
        >
          <path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" fillOpacity="0.3" />
          <path d="M12 6L6 12l6 6 6-6-6-6z" fill="currentColor" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-base font-extrabold tracking-tight text-foreground flex items-center">
          <span className="text-rose-500">Kollege</span>
          <span className="text-slate-900 dark:text-white">Apply</span>
        </div>
      </div>
    </div>
  );
}
