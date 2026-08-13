import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 10);
    return () => clearTimeout(t);
  }, []);
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
      style={{
        bottom: "calc(80px + env(safe-area-inset-bottom))",
        opacity: ready ? 1 : 0,
        transform: ready ? "scale(1)" : "scale(0.6)",
        transition:
          "opacity 400ms cubic-bezier(0.34,1.56,0.64,1) 150ms, transform 400ms cubic-bezier(0.34,1.56,0.64,1) 150ms",
      }}
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
      {extended && <span className="text-sm">{label}</span>}
    </button>
  );
}