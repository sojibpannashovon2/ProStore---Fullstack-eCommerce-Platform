import { Skeleton } from "@/components/ui/skeleton"

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto h-[22rem] w-full max-w-80 overflow-hidden rounded-[32px] border p-[3px]"
    >
      <Skeleton className="h-[68%] rounded-[29px]" />
      <div className="flex h-[32%] flex-col justify-between rounded-b-[29px] px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  )
}
