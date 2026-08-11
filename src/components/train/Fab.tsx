import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Fab({
  onClick,
  label,
  extended,
  className,
}: {
  onClick: () => void;
  label: string;
  extended?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "fixed right-5 z-50 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground font-semibold",
        "shadow-[0_4px_20px_hsl(var(--primary)/0.4)] transition",
        extended ? "h-14 rounded-full px-5" : "h-14 w-14 rounded-full",
        className,
      )}
      style={{ bottom: "calc(80px + env(safe-area-inset-bottom))" }}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
      {extended && <span className="text-sm">{label}</span>}
    </button>
  );
}