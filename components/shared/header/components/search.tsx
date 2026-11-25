"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { translate } from "@/lib/i18n/translations"

import { useLocale } from "@/providers/locale-provider"

export function Search({ categories }: { categories: { category: string }[] }) {
  const router = useRouter()
  const { locale } = useLocale()
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category && category !== "all") params.set("category", category)

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form className="w-full" onSubmit={handleSearch}>
      <div className="flex w-full max-w-sm items-center gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-auto shrink-0">
            <SelectValue placeholder={translate(locale, "All")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{translate(locale, "All")}</SelectItem>
            {categories.map((x) => (
              <SelectItem key={x.category} value={x.category}>
                {translate(locale, x.category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder={translate(locale, "Search...")}
          aria-label={translate(locale, "Search...")}
          className="min-w-0 flex-1"
        />
        <Button type="submit" aria-label={translate(locale, "Search")}>
          <SearchIcon />
        </Button>
      </div>
    </form>
  )
}
