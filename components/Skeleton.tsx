export function SkeletonLine({ width = "100%", height = 16 }: { width?: string; height?: number }) {
  return <div className="skeleton-block" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="notice-card rounded-sm overflow-hidden">
      <div className="skeleton-block aspect-[4/3]" />
      <div className="p-4 space-y-2">
        <SkeletonLine width="60%" height={22} />
        <SkeletonLine width="80%" />
        <SkeletonLine width="50%" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5 space-y-4">
        <SkeletonLine width="40%" height={32} />
        <SkeletonLine width="70%" />
        <div className="pt-4">
          <SkeletonGrid />
        </div>
      </div>
    </section>
  );
}
