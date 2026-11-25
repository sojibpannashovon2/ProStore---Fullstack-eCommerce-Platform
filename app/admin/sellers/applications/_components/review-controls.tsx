"use client"

import { useState, useTransition } from "react"

import { reviewSellerApplication } from "@/lib/actions/seller-application.actions"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function ReviewControls({ applicationId }: { applicationId: string }) {
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  function review(decision: "approve" | "reject") {
    startTransition(async () => {
      const result = await reviewSellerApplication(
        applicationId,
        decision,
        reason,
      )
      setMessage(result.message)
    })
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Rejection reason (required when rejecting)"
        maxLength={1000}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => review("approve")}
        >
          Approve seller
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={isPending || reason.trim().length < 10}
          onClick={() => review("reject")}
        >
          Reject
        </Button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </div>
  )
}
