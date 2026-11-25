import { Toaster } from "@/components/ui/sonner"

import type { Locale } from "@/lib/i18n/translations"

import { LocaleProvider } from "./locale-provider"
import { ThemeProvider } from "./theme-provider"

export function Providers({
  children,
  locale,
}: Readonly<{
  children: React.ReactNode
  locale: Locale
}>) {
  return (
    <LocaleProvider initialLocale={locale}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </LocaleProvider>
  )
}
