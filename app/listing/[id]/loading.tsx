import { SkeletonLine } from "@/components/Skeleton";
export default function Loading() {
  return (
    <section className="py-10">
      <div className="max-w-[1080px] mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-[1.25fr_.9fr] gap-9">
          <div className="space-y-3">
            <SkeletonLine width="60%" height={30} />
            <div className="skeleton-block aspect-[16/10]" />
          </div>
          <div className="skeleton-block h-[320px]" />
        </div>
      </div>
    </section>
  );
}
