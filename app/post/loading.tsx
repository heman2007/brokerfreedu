import { SkeletonLine } from "@/components/Skeleton";
export default function Loading() {
  return (
    <section className="py-12">
      <div className="max-w-[660px] mx-5 sm:mx-auto space-y-3">
        <SkeletonLine width="50%" height={28} />
        <div className="skeleton-block h-[400px] mt-4" />
      </div>
    </section>
  );
}
