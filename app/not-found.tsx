import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TranslatedText } from "@/components/shared/translated-text"
import { APP_NAME } from "@/constants"

export const metadata: Metadata = {
  title: "Not Found",
}

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-md">
        <CardHeader className="flex flex-col items-center p-6">
          <Image
            src="/images/kinora-logo.png"
            width={450}
            height={150}
            alt={`${APP_NAME} logo`}
            priority={true}
            className="mb-4 h-10 w-auto"
          />
          <h1 className="text-2xl font-bold sm:text-3xl">
            <TranslatedText text="Not Found" />
          </h1>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            <TranslatedText text="Could not find requested page" />
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/"><TranslatedText text="Back To Home" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
