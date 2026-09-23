import { SkeletonGrid, SkeletonLine } from "@/components/Skeleton";
export default function Loading() {
  return (
    <section className="py-12">
      <div className="max-w-[1080px] mx-auto px-5">
        <SkeletonLine width="30%" height={28} />
        <div className="h-6" />
        <SkeletonGrid />
      </div>
    </section>
  );
}
