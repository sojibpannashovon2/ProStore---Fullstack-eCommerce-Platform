import {
  getAllBrands,
  getAllCategories,
  getAllProducts,
} from "@/lib/actions/product.actions"

import { EmptyState } from "@/components/shared/empty-state"
import { AppPagination } from "@/components/shared/app-pagination"
import { ProductCard } from "../product/[slug]/_components/product-card"
import { ActiveFilters } from "./_components/active-filters"
import { FilterSidebar } from "./_components/filter-sidebar"
import { SortSelect } from "./_components/sort-select"
import { SearchXIcon } from "lucide-react"

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    price?: string
    rating?: string
    brand?: string
    availability?: string
    sort?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    q = "all",
    category = "all",
    price = "all",
    rating = "all",
    brand = "all",
    availability = "all",
    sort = "newest",
    page = "1",
  } = await searchParams

  // Construct filter url
  const getFilterUrl = ({
    c,
    p,
    s,
    r,
    b,
    a,
    pg,
  }: {
    c?: string
    p?: string
    s?: string
    r?: string
    b?: string
    a?: string
    pg?: string
  }) => {
    const params = { q, category, price, rating, brand, availability, sort, page }

    if (c) params.category = c
    if (p) params.price = p
    if (s) params.sort = s
    if (r) params.rating = r
    if (b) params.brand = b
    if (a) params.availability = a
    if (pg) params.page = pg

    return `/search?${new URLSearchParams(params).toString()}`
  }

  const [products, categories, brands] = await Promise.all([
    getAllProducts({
      query: q,
      category,
      page: Number(page),
      price,
      rating,
      sort,
      brand,
      availability: availability as "all" | "in-stock",
    }),
    getAllCategories(),
    getAllBrands(),
  ])

  return (
    <div className="grid md:grid-cols-5 md:gap-5">
      <FilterSidebar
        currentFilters={{ category, price, rating, brand, availability }}
        categories={categories}
        brands={brands}
        getFilterUrl={getFilterUrl}
      />

      <div className="space-y-4 md:col-span-4">
        <div className="flex-between my-4 flex-col md:flex-row">
          <ActiveFilters
            filters={{ q, category, price, rating, brand, availability }}
          />
          <div className="ml-auto">
            <SortSelect
              currentSort={sort}
              searchParams={{
                q,
                category,
                price,
                rating,
                brand,
                availability,
                page,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.data.length === 0 ? (
            <div className="md:col-span-3">
              <EmptyState
                icon={<SearchXIcon className="size-6" />}
                title="No products found"
                description="Try changing your search or filters."
                actionLabel="View All Products"
                actionHref="/search"
              />
            </div>
          ) : (
            products.data.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index === 0}
              />
            ))
          )}
        </div>

        {products.totalPages > 1 && (
          <AppPagination
            page={Number(page) || 1}
            totalPages={products?.totalPages}
          />
        )}
      </div>
    </div>
  )
}

// Keep your generateMetadata function the same
export async function generateMetadata(props: {
  searchParams: Promise<{
    q: string
    category: string
    price: string
    rating: string
    brand?: string
    availability?: string
  }>
}) {
  const {
    q = "all",
    category = "all",
    price = "all",
    rating = "all",
    brand = "all",
    availability = "all",
  } = await props.searchParams

  const isQuerySet = q && q !== "all" && q.trim() !== ""
  const isCategorySet = category && category !== "all" && category.trim() !== ""
  const isPriceSet = price && price !== "all" && price.trim() !== ""
  const isRatingSet = rating && rating !== "all" && rating.trim() !== ""
  const isBrandSet = brand && brand !== "all" && brand.trim() !== ""
  const isAvailabilitySet =
    availability && availability !== "all" && availability.trim() !== ""

  if (
    isQuerySet ||
    isCategorySet ||
    isPriceSet ||
    isRatingSet ||
    isBrandSet ||
    isAvailabilitySet
  ) {
    return {
      title: `
        Search ${isQuerySet ? q : ""} 
        ${isCategorySet ? `& Category ${category}` : ""}
        ${isPriceSet ? `& Price ${price}` : ""}
        ${isRatingSet ? `& Rating ${rating}` : ""}`,
    }
  } else {
    return {
      title: "Search Products",
    }
  }
}
