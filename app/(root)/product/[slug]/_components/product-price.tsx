"use client"

import { cn, formatCurrency } from "@/lib/utils"
import { useLocale } from "@/providers/locale-provider"

interface ProductPriceProps extends React.ComponentProps<"p"> {
  value: number
}

export function ProductPrice({ value, className }: ProductPriceProps) {
  const { locale } = useLocale()

  return (
    <p className={cn("text-2xl", className)}>
      {formatCurrency(value, locale)}
    </p>
  )
}
