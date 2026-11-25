"use client"

import { useEffect } from "react"

import Link from "next/link"

import { TranslatedText } from "@/components/shared/translated-text"
import { Button } from "@/components/ui/button"

interface RouteErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function RouteError({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main
      role="alert"
      className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <h1 className="text-2xl font-bold">
        <TranslatedText text="Something went wrong" />
      </h1>
      <p className="text-muted-foreground">
        <TranslatedText text="An unexpected error occurred. Please try again." />
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <TranslatedText text="Try again" />
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <TranslatedText text="Back To Home" />
          </Link>
        </Button>
      </div>
    </main>
  )
}
