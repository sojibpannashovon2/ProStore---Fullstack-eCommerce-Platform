import { ProductCardSkeleton } from "@/components/shared/product-card-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div
      aria-busy="true"
      className="grid grid-cols-1 gap-5 md:grid-cols-5"
      role="status"
      aria-label="Loading search results"
    >
      <aside className="hidden space-y-6 md:block">
        <Skeleton className="h-8 w-28" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3 border-b pb-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        ))}
      </aside>
      <section className="space-y-4 md:col-span-4">
        <Skeleton className="h-10 w-full md:hidden" />
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </div>
  )
}
