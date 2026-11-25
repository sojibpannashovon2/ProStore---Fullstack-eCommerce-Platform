// components/search/sort-select.tsx
"use client"

import { useRouter } from "next/navigation"

import { SORT_ORDERS } from "@/constants"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TranslatedText } from "@/components/shared/translated-text"

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

// components/search/sort-select.tsx

interface SortSelectProps {
  currentSort: string
  searchParams: {
    q?: string
    category?: string
    price?: string
    rating?: string
    brand?: string
    availability?: string
    page?: string
  }
}

export function SortSelect({ currentSort, searchParams }: SortSelectProps) {
  const router = useRouter()

  const handleValueChange = (value: string) => {
    const newParams = new URLSearchParams({
      ...searchParams,
      sort: value,
      page: "1", // Reset to first page when changing sort
    })
    router.push(`/search?${newParams.toString()}`)
  }

  return (
    <Select value={currentSort} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={<TranslatedText text="Sort by" />} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel><TranslatedText text="Sort Options" /></SelectLabel>
          {SORT_ORDERS.map((s) => (
            <SelectItem key={s} value={s}>
              <TranslatedText text={s} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
