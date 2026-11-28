"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { toast } from "sonner"

import { signInDefaultValues } from "@/constants"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TranslatedText } from "@/components/shared/translated-text"
import { translateMessage } from "@/lib/i18n/translations"
import { useLocale } from "@/providers/locale-provider"

const CredentialsSignInForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useLocale()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const signUpHref = `/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}`
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") || "")
    const password = String(formData.get("password") || "")

    setPending(true)
    const toastId = toast.loading(translateMessage(locale, "Signing In..."))
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (!result || result.error) {
        toast.error(translateMessage(locale, "Invalid email or password"), {
          id: toastId,
        })
        setPending(false)
        return
      }

      toast.success(translateMessage(locale, "Signed in successfully"), {
        id: toastId,
      })
      router.push(callbackUrl)
    } catch {
      toast.error(translateMessage(locale, "Invalid email or password"), {
        id: toastId,
      })
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email"><TranslatedText text="Email" /></Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={signInDefaultValues.email}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password"><TranslatedText text="Password" /></Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="password"
            defaultValue={signInDefaultValues.password}
          />
        </div>
        <div>
          <Button disabled={pending} className="w-full" variant="default" type="submit">
            {pending ? <TranslatedText text="Signing In..." /> : <TranslatedText text="Sign In" />}
          </Button>
        </div>

        <div className="text-muted-foreground text-center text-sm">
          <TranslatedText text="Don't have an account?" />{" "}
          <Link href={signUpHref} target="_self" className="link">
            <TranslatedText text="Sign Up" />
          </Link>
        </div>
      </div>
    </form>
  )
}

export default CredentialsSignInForm