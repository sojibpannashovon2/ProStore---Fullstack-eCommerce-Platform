import type { Metadata } from "next"

import { getMyWishlist } from "@/lib/actions/wishlist.actions"

import { EmptyState } from "@/components/shared/empty-state"
import { ProductCard } from "@/app/(root)/product/[slug]/_components/product-card"
import { Heart } from "lucide-react"

export const metadata: Metadata = {
  title: "Wishlist",
  robots: { index: false, follow: false },
}

export default async function WishlistPage() {
  const products = await getMyWishlist()

  return (
    <div className="space-y-4">
      <h1 className="h2-bold">Wishlist</h1>
      {products.length === 0 ? (
        <EmptyState
          icon={<Heart className="size-6" />}
          title="Your wishlist is empty"
          description="Save products you want to find again."
          actionLabel="Browse products"
          actionHref="/search"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
