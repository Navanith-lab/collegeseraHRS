export function BrandLogo({
  variant = "default",
  className = "",
  size = "md",
}: {
  variant?: "default" | "light";
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const heightClass = size === "sm" ? "h-7" : size === "lg" ? "h-14" : "h-9";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="CollegeSera Logo"
        className={`${heightClass} w-auto object-contain transition-all`}
        onError={(e) => {
          // Fallback if image load fails
          const target = e.currentTarget;
          target.onerror = null;
          target.style.display = "none";
        }}
      />
    </div>
  );
}
