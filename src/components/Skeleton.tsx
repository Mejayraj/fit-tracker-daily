import { cn } from "@/lib/utils";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("shimmer", className)} style={style} />;
}

export function RingSkeleton() {
  return (
    <div className="flex flex-col items-center">
      <Skeleton className="rounded-full" style={{ width: 200, height: 200 }} />
      <div className="grid grid-cols-3 gap-6 mt-6 w-full">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-3 w-14 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MacrosSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default Skeleton;
