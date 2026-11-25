// components/shared/status-card.tsx
import Link from "next/link"

import { formatDateTime } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TranslatedText } from "@/components/shared/translated-text"

type StatusInfo = {
  isComplete: boolean
  completedAt: Date | null
  completeLabel: string
  incompleteLabel: string
}

interface StatusCardProps {
  title: string
  status?: StatusInfo | null // Explicit null for conditional display
  editHref?: string | null // Explicit null for conditional display
  children: React.ReactNode
}

export function StatusCard({
  title,
  status = null, // Default to null (hidden)
  editHref = null, // Default to null (hidden)
  children,
}: StatusCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle><TranslatedText text={title} /></CardTitle>
        <div className="flex items-center gap-2">
          {/* Conditionally render status badge */}
          {status !== null && (
            <Badge variant={status.isComplete ? "secondary" : "destructive"}>
              {status.isComplete ? (
                <>
                  <TranslatedText text={status.completeLabel} />{" "}
                  {status.completedAt
                    ? formatDateTime(status.completedAt).dateTime
                    : ""}
                </>
              ) : (
                <TranslatedText text={status.incompleteLabel} />
              )}
            </Badge>
          )}

          {/* Conditionally render edit button */}
          {editHref !== null && (
            <Link href={editHref}>
              <Button variant="outline" size="sm">
                <TranslatedText text="Edit" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
