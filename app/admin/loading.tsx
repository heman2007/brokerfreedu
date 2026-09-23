import { SkeletonLine } from "@/components/Skeleton";
export default function Loading() {
  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5 space-y-3">
        <SkeletonLine width="50%" height={28} />
        <div className="skeleton-block h-[300px] mt-4" />
      </div>
    </section>
  );
}
