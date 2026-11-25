import { ProductCardSkeleton } from "@/components/shared/product-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function StorefrontLoading() {
  return (
    <div aria-busy="true" className="space-y-10 py-5">
      <div className="relative">
        <Skeleton className="h-[320px] w-full rounded-xl sm:h-[420px] lg:h-[520px]" />
        <Skeleton className="absolute right-0 bottom-5 left-0 mx-auto h-11 w-60 rounded-lg" />
      </div>
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  )
}
