"use client"

import { translate, translateCatalogName } from "@/lib/i18n/translations"

import { useLocale } from "@/providers/locale-provider"

export function TranslatedText({
  text,
  kind,
}: {
  text: string
  kind?: "productName"
}) {
  const { locale } = useLocale()
  return <>{kind === "productName" ? translateCatalogName(locale, text) : translate(locale, text)}</>
}
