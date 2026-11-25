"use client"

import { useLocale } from "@/providers/locale-provider"

import { formatCurrency } from "@/lib/utils"

interface CurrencyTextProps {
  value: number | string
  currency?: "locale" | "USD" | "BDT"
  fractionDigits?: 0 | 2
}

export function CurrencyText({
  value,
  currency = "locale",
  fractionDigits = 0,
}: CurrencyTextProps) {
  const { locale } = useLocale()
  return <>{formatCurrency(value, locale, currency, fractionDigits)}</>
}
