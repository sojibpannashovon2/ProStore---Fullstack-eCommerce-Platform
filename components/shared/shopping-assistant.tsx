"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

import { MessageCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { translate } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

const ShoppingAssistantPanel = dynamic(
  () =>
    import("./shopping-assistant-panel").then(
      (module) => module.ShoppingAssistantPanel,
    ),
  { ssr: false },
)

export function ShoppingAssistant() {
  const { locale } = useLocale()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const toggleAssistant = () => {
    setIsLoaded(true)
    setIsOpen((open) => !open)
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {isLoaded && (
        <ShoppingAssistantPanel
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
      <Button
        type="button"
        aria-label={
          isOpen
            ? translate(locale, "Close shopping assistant")
            : translate(locale, "Open shopping assistant")
        }
        aria-expanded={isOpen}
        aria-controls={isOpen ? "shopping-assistant-panel" : undefined}
        className="rounded-full shadow-lg"
        onClick={toggleAssistant}
      >
        {isOpen ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-5" aria-hidden="true" />
        )}
        {translate(locale, isOpen ? "Close assistant" : "Ask Kinora AI")}
      </Button>
    </div>
  )
}
