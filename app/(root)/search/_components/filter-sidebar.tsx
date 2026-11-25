import { PRICES, RATINGS } from "@/constants"

import { TranslatedText } from "@/components/shared/translated-text"

import { FilterSection } from "./filter-section"

interface FilterSidebarProps {
  currentFilters: {
    category: string
    price: string
    rating: string
    brand: string
    availability: string
  }
  categories: { category: string }[]
  brands: { brand: string }[]
  getFilterUrl: (params: {
    c?: string
    p?: string
    r?: string
    b?: string
    a?: string
  }) => string
}

export function FilterSidebar({
  currentFilters,
  categories,
  brands,
  getFilterUrl,
}: FilterSidebarProps) {
  return (
    <>
      <details className="rounded-lg border p-3 md:hidden">
        <summary className="cursor-pointer font-medium">
          <TranslatedText text="Filters" />
        </summary>
        <div className="pt-3">
          <FilterOptions
            currentFilters={currentFilters}
            categories={categories}
            brands={brands}
            getFilterUrl={getFilterUrl}
          />
        </div>
      </details>
      <div className="hidden border-r p-4 md:block">
        <FilterOptions
          currentFilters={currentFilters}
          categories={categories}
          brands={brands}
          getFilterUrl={getFilterUrl}
        />
      </div>
    </>
  )
}

function FilterOptions({
  currentFilters,
  categories,
  brands,
  getFilterUrl,
}: FilterSidebarProps) {
  return (
    <>
      <FilterSection
        title="Categories"
        items={categories.map((c) => ({ name: c.category, value: c.category }))}
        currentValue={currentFilters.category}
        paramKey="c"
        getFilterUrl={getFilterUrl}
      />
      <FilterSection
        title="Brands"
        items={brands.map((brand) => ({
          name: brand.brand,
          value: brand.brand,
        }))}
        currentValue={currentFilters.brand}
        paramKey="b"
        getFilterUrl={getFilterUrl}
      />
      <FilterSection
        title="Price"
        items={PRICES}
        currentValue={currentFilters.price}
        paramKey="p"
        getFilterUrl={getFilterUrl}
      />
      <FilterSection
        title="Availability"
        items={[{ name: "In Stock", value: "in-stock" }]}
        currentValue={currentFilters.availability}
        paramKey="a"
        getFilterUrl={getFilterUrl}
      />
      <FilterSection
        title="Ratings"
        items={RATINGS.map((r) => ({
          name: `${r} stars & up`,
          value: r.toString(),
        }))}
        currentValue={currentFilters.rating}
        paramKey="r"
        getFilterUrl={getFilterUrl}
      />
    </>
  )
}
