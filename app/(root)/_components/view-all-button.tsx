import Link from "next/link"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"

interface ViewAllButtonProps {
  category?: string
}

export function ViewAllButton({ category }: ViewAllButtonProps = {}) {
  const href = category ? `/search?category=${encodeURIComponent(category)}` : "/search"
  return (
    <div className="my-8 flex items-center justify-center">
      <Button asChild className="px-8 py-4 text-lg font-semibold">
        <Link href={href}>
          <TranslatedText text="View All Products" />
        </Link>
      </Button>
    </div>
  )
}
