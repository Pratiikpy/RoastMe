interface SkeletonCardProps {
  index?: number;
}

export function SkeletonCard({ index = 0 }: SkeletonCardProps) {
  return (
    <div
      className="rounded-2xl p-[1px] bg-gradient-to-br from-orange-900/40 to-red-900/40 animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="rounded-2xl bg-[var(--surface-raised)] p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full skeleton-shimmer" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded skeleton-shimmer" />
            <div className="h-2.5 w-16 rounded skeleton-shimmer" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded skeleton-shimmer" />
          <div className="h-3 w-4/5 rounded skeleton-shimmer" />
          <div className="h-3 w-3/5 rounded skeleton-shimmer" />
        </div>
        <div className="flex justify-between pt-1">
          <div className="h-2.5 w-20 rounded skeleton-shimmer" />
          <div className="h-2.5 w-12 rounded skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
