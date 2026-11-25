import { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { TranslatedText } from "@/components/shared/translated-text"

export const metadata: Metadata = {
  title: "Unauthorized Access",
}

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto flex h-[calc(100vh-200px)] flex-col items-center justify-center space-y-4">
      <h1 className="h1-bold text-4xl">
        <TranslatedText text="Unauthorized Access" />
      </h1>
      <p className="text-muted-foreground">
        <TranslatedText text="You do not have permission to access this page." />
      </p>
      <Button asChild>
        <Link href="/"><TranslatedText text="Return Home" /></Link>
      </Button>
    </div>
  )
}
