import Link from "next/link"

import { PRICES } from "@/constants"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"

interface ActiveFiltersProps {
  filters: {
    q: string
    category: string
    price: string
    rating: string
    brand: string
    availability: string
  }
}

export function ActiveFilters({ filters }: ActiveFiltersProps) {
  const { q, category, price, rating, brand, availability } = filters
  const priceLabel = PRICES.find((item) => item.value === price)?.name ?? price

  const hasFilters =
    (q !== "all" && q !== "") ||
    (category !== "all" && category !== "") ||
    rating !== "all" ||
    price !== "all" ||
    brand !== "all" ||
    availability !== "all"

  if (!hasFilters) return null

  return (
    <div className="flex items-center gap-0.5">
      {q !== "all" && q !== "" && (
        <Badge><TranslatedText text="Query: " />{q}</Badge>
      )}
      {category !== "all" && category !== "" && (
        <Badge><TranslatedText text="Category: " /><TranslatedText text={category} /></Badge>
      )}
      {price !== "all" && (
        <Badge>
          <TranslatedText text="Price: " />
          <TranslatedText text={priceLabel} />
        </Badge>
      )}
      {brand !== "all" && (
        <Badge><TranslatedText text="Brand: " />{brand}</Badge>
      )}
      {availability !== "all" && (
        <Badge><TranslatedText text="In stock" /></Badge>
      )}
      {rating !== "all" && (
        <Badge>
          <TranslatedText text="Rating: " />{rating}{" "}
          <TranslatedText text="stars & up" />
        </Badge>
      )}
      &nbsp;
      <Button variant={"link"} asChild>
        <Link href="/search"><TranslatedText text="Clear" /></Link>
      </Button>
    </div>
  )
}
