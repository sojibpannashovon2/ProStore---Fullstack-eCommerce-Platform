"use client"

import { LanguagesIcon } from "lucide-react"

import { useLocale } from "@/providers/locale-provider"

import { Button } from "@/components/ui/button"

export function LanguageToggle() {
  const { locale, setLocale } = useLocale()
  const nextLocale = locale === "bn" ? "en" : "bn"

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => setLocale(nextLocale)}
      aria-label={locale === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
      title={locale === "bn" ? "Switch to English" : "বাংলায় পরিবর্তন করুন"}
    >
      <LanguagesIcon className="size-4" />
      {locale === "bn" ? "English" : "বাংলা"}
    </Button>
  )
}
