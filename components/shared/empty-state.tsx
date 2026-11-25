import type { ReactNode } from "react"

import Link from "next/link"

import { TranslatedText } from "@/components/shared/translated-text"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel: string
  actionHref: string
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center"
    >
      <div
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </div>
      <h2 className="text-lg font-semibold">
        <TranslatedText text={title} />
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        <TranslatedText text={description} />
      </p>
      <Button asChild className="mt-2">
        <Link href={actionHref}>
          <TranslatedText text={actionLabel} />
        </Link>
      </Button>
    </div>
  )
}
