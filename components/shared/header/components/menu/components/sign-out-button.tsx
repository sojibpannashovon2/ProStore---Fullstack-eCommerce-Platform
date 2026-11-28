"use client"

import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { toast } from "sonner"

import { useLocale } from "@/providers/locale-provider"
import { translateMessage } from "@/lib/i18n/translations"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"

export function SignOutButton() {
  const router = useRouter()
  const { locale } = useLocale()

  const handleClick = async () => {
    await signOut({ redirect: false })
    toast.success(translateMessage(locale, "Signed out successfully"))
    router.push("/")
    router.refresh()
  }
  return (
    <Button
      className="h-4 w-full justify-start px-2 py-4"
      variant="ghost"
      onClick={handleClick}
    >
      <TranslatedText text="Sign Out" />
    </Button>
  )
}